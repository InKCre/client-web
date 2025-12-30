import { Extension, ExtensionRef } from "./extension";

/**
 * 插件生命周期状态
 */
export enum ExtensionState {
  DISCOVERED = "DISCOVERED", // 从数据库读取
  LOADING = "LOADING", // Module Federation 加载中
  LOADED = "LOADED", // 模块已加载，未初始化
  INITIALIZING = "INITIALIZING", // 调用 initialize 中
  READY = "READY", // 已初始化，等待激活
  ACTIVATING = "ACTIVATING", // 激活中
  ACTIVE = "ACTIVE", // 正在工作
  DEACTIVATING = "DEACTIVATING", // 停止工作，清理运行时资源
  UNLOADING = "UNLOADING", // 清理所有资源
  UNLOADED = "UNLOADED", // 已卸载
  ERROR = "ERROR", // 错误状态
}

/**
 * 插件接口定义
 */
export interface IExtension {
  /**
   * 初始化插件
   */
  initialize?(): Promise<void>;

  /**
   * 激活插件
   */
  activate?(): Promise<void>;

  /**
   * 停用插件
   */
  deactivate?(): Promise<void>;

  /**
   * 卸载插件
   */
  dispose?(): Promise<void>;
}

/**
 * 插件实例，包含状态和元数据
 */
export class ExtensionInstance {
  extension: Extension;
  state: ExtensionState;
  module: IExtension | null = null;
  error: Error | null = null;
  retryCount: number = 0;
  maxRetries: number = 3;

  constructor(extension: Extension) {
    this.extension = extension;
    this.state = ExtensionState.DISCOVERED;
  }

  /**
   * 设置状态
   */
  setState(state: ExtensionState): void {
    console.log(
      `[ExtensionManager] ${this.extension.id}: ${this.state} -> ${state}`
    );
    this.state = state;
  }

  /**
   * 设置错误
   */
  setError(error: Error): void {
    console.error(`[ExtensionManager] ${this.extension.id} error:`, error);
    this.error = error;
    this.state = ExtensionState.ERROR;
  }

  /**
   * 清除错误
   */
  clearError(): void {
    this.error = null;
  }

  /**
   * 是否可以重试
   */
  canRetry(): boolean {
    return this.retryCount < this.maxRetries;
  }

  /**
   * 增加重试计数
   */
  incrementRetry(): void {
    this.retryCount++;
  }

  /**
   * 重置重试计数
   */
  resetRetry(): void {
    this.retryCount = 0;
  }
}

/**
 * ExtensionManager
 * 负责插件的发现、加载、激活、停用、卸载
 */
export class ExtensionManager {
  private instances: Map<ExtensionRef, ExtensionInstance> = new Map();
  private clientId: string;

  constructor(clientId: string) {
    this.clientId = clientId;
  }

  /**
   * 从数据库发现插件
   */
  async discoverExtensions(): Promise<void> {
    try {
      const extensions = await Extension.list();
      for (const extension of extensions) {
        if (!this.instances.has(extension.id)) {
          this.instances.set(extension.id, new ExtensionInstance(extension));
        }
      }
    } catch (error) {
      console.error("[ExtensionManager] Failed to discover extensions:", error);
      throw error;
    }
  }

  /**
   * 获取指定插件实例
   */
  getInstance(id: ExtensionRef): ExtensionInstance | undefined {
    return this.instances.get(id);
  }

  /**
   * 获取所有插件实例
   */
  getAllInstances(): ExtensionInstance[] {
    return Array.from(this.instances.values());
  }

  /**
   * 获取当前客户端已启用的插件
   */
  getEnabledInstances(): ExtensionInstance[] {
    return this.getAllInstances().filter((instance) =>
      instance.extension.isEnabledForClient(this.clientId)
    );
  }

  /**
   * 并行加载插件（使用 Module Federation）
   * 这是一个占位实现，实际的 Module Federation 加载逻辑需要根据项目配置
   */
  private async loadExtensionModule(
    instance: ExtensionInstance
  ): Promise<IExtension> {
    // TODO: 实现实际的 Module Federation 加载逻辑
    // 例如: const module = await import(`remote_${instance.extension.id}/Extension`);
    throw new Error("Module Federation loading not implemented yet");
  }

  /**
   * 加载单个插件
   */
  async loadExtension(id: ExtensionRef): Promise<void> {
    const instance = this.instances.get(id);
    if (!instance) {
      throw new Error(`Extension ${id} not found`);
    }

    if (instance.state !== ExtensionState.DISCOVERED) {
      console.warn(
        `[ExtensionManager] Extension ${id} is not in DISCOVERED state`
      );
      return;
    }

    try {
      instance.setState(ExtensionState.LOADING);
      const module = await this.loadExtensionModule(instance);
      instance.module = module;
      instance.setState(ExtensionState.LOADED);
      instance.clearError();
      instance.resetRetry();
    } catch (error) {
      instance.setError(error as Error);
      throw error;
    }
  }

  /**
   * 初始化插件
   */
  async initializeExtension(id: ExtensionRef): Promise<void> {
    const instance = this.instances.get(id);
    if (!instance) {
      throw new Error(`Extension ${id} not found`);
    }

    if (instance.state !== ExtensionState.LOADED) {
      console.warn(
        `[ExtensionManager] Extension ${id} is not in LOADED state`
      );
      return;
    }

    try {
      instance.setState(ExtensionState.INITIALIZING);
      if (instance.module?.initialize) {
        await instance.module.initialize();
      }
      instance.setState(ExtensionState.READY);
    } catch (error) {
      instance.setError(error as Error);
      throw error;
    }
  }

  /**
   * 激活插件
   */
  async activateExtension(id: ExtensionRef): Promise<void> {
    const instance = this.instances.get(id);
    if (!instance) {
      throw new Error(`Extension ${id} not found`);
    }

    if (instance.state !== ExtensionState.READY) {
      console.warn(`[ExtensionManager] Extension ${id} is not in READY state`);
      return;
    }

    try {
      instance.setState(ExtensionState.ACTIVATING);
      if (instance.module?.activate) {
        await instance.module.activate();
      }
      instance.setState(ExtensionState.ACTIVE);
    } catch (error) {
      instance.setError(error as Error);
      throw error;
    }
  }

  /**
   * 停用插件
   */
  async deactivateExtension(id: ExtensionRef): Promise<void> {
    const instance = this.instances.get(id);
    if (!instance) {
      throw new Error(`Extension ${id} not found`);
    }

    if (instance.state !== ExtensionState.ACTIVE) {
      console.warn(
        `[ExtensionManager] Extension ${id} is not in ACTIVE state`
      );
      return;
    }

    try {
      instance.setState(ExtensionState.DEACTIVATING);
      if (instance.module?.deactivate) {
        await instance.module.deactivate();
      }
      instance.setState(ExtensionState.READY);
    } catch (error) {
      instance.setError(error as Error);
      throw error;
    }
  }

  /**
   * 卸载插件
   */
  async unloadExtension(id: ExtensionRef): Promise<void> {
    const instance = this.instances.get(id);
    if (!instance) {
      throw new Error(`Extension ${id} not found`);
    }

    if (instance.state !== ExtensionState.READY) {
      console.warn(
        `[ExtensionManager] Extension ${id} is not in READY state`
      );
      return;
    }

    try {
      instance.setState(ExtensionState.UNLOADING);
      if (instance.module?.dispose) {
        await instance.module.dispose();
      }
      instance.module = null;
      instance.setState(ExtensionState.UNLOADED);
    } catch (error) {
      instance.setError(error as Error);
      throw error;
    }
  }

  /**
   * 重试加载失败的插件
   */
  async retryExtension(id: ExtensionRef): Promise<void> {
    const instance = this.instances.get(id);
    if (!instance) {
      throw new Error(`Extension ${id} not found`);
    }

    if (instance.state !== ExtensionState.ERROR) {
      console.warn(`[ExtensionManager] Extension ${id} is not in ERROR state`);
      return;
    }

    if (!instance.canRetry()) {
      throw new Error(
        `Extension ${id} has exceeded max retry count (${instance.maxRetries})`
      );
    }

    instance.incrementRetry();
    instance.clearError();
    instance.setState(ExtensionState.DISCOVERED);

    await this.loadExtension(id);
  }

  /**
   * 并行加载所有已启用的插件
   */
  async loadAllEnabled(): Promise<void> {
    const enabledInstances = this.getEnabledInstances().filter(
      (instance) => instance.state === ExtensionState.DISCOVERED
    );

    console.log(
      `[ExtensionManager] Loading ${enabledInstances.length} enabled extensions in parallel`
    );

    // 并行加载，错误隔离
    const results = await Promise.allSettled(
      enabledInstances.map((instance) => this.loadExtension(instance.extension.id))
    );

    // 统计结果
    const succeeded = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    console.log(
      `[ExtensionManager] Load completed: ${succeeded} succeeded, ${failed} failed`
    );
  }

  /**
   * 并行初始化所有已加载的插件
   */
  async initializeAllLoaded(): Promise<void> {
    const loadedInstances = this.getAllInstances().filter(
      (instance) => instance.state === ExtensionState.LOADED
    );

    console.log(
      `[ExtensionManager] Initializing ${loadedInstances.length} loaded extensions in parallel`
    );

    const results = await Promise.allSettled(
      loadedInstances.map((instance) =>
        this.initializeExtension(instance.extension.id)
      )
    );

    const succeeded = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    console.log(
      `[ExtensionManager] Initialize completed: ${succeeded} succeeded, ${failed} failed`
    );
  }

  /**
   * 并行激活所有就绪的插件
   */
  async activateAllReady(): Promise<void> {
    const readyInstances = this.getEnabledInstances().filter(
      (instance) => instance.state === ExtensionState.READY
    );

    console.log(
      `[ExtensionManager] Activating ${readyInstances.length} ready extensions in parallel`
    );

    const results = await Promise.allSettled(
      readyInstances.map((instance) =>
        this.activateExtension(instance.extension.id)
      )
    );

    const succeeded = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    console.log(
      `[ExtensionManager] Activate completed: ${succeeded} succeeded, ${failed} failed`
    );
  }

  /**
   * 启用插件（更新数据库并激活）
   */
  async enableExtension(id: ExtensionRef): Promise<void> {
    const instance = this.instances.get(id);
    if (!instance) {
      throw new Error(`Extension ${id} not found`);
    }

    // 更新数据库
    const updatedExtension = await instance.extension.enable(this.clientId);
    instance.extension = updatedExtension;

    // 如果插件已经准备好，激活它
    if (instance.state === ExtensionState.READY) {
      await this.activateExtension(id);
    }
    // 如果插件还未加载，加载并激活
    else if (instance.state === ExtensionState.DISCOVERED) {
      await this.loadExtension(id);
      await this.initializeExtension(id);
      await this.activateExtension(id);
    }
  }

  /**
   * 禁用插件（停用并更新数据库）
   */
  async disableExtension(id: ExtensionRef): Promise<void> {
    const instance = this.instances.get(id);
    if (!instance) {
      throw new Error(`Extension ${id} not found`);
    }

    // 如果插件正在运行，先停用
    if (instance.state === ExtensionState.ACTIVE) {
      await this.deactivateExtension(id);
    }

    // 更新数据库
    const updatedExtension = await instance.extension.disable(this.clientId);
    instance.extension = updatedExtension;
  }

  /**
   * 完整的启动流程
   */
  async startup(): Promise<void> {
    console.log("[ExtensionManager] Starting up...");

    await this.discoverExtensions();
    await this.loadAllEnabled();
    await this.initializeAllLoaded();
    await this.activateAllReady();

    console.log("[ExtensionManager] Startup completed");
  }

  /**
   * 完整的关闭流程
   */
  async shutdown(): Promise<void> {
    console.log("[ExtensionManager] Shutting down...");

    const activeInstances = this.getAllInstances().filter(
      (instance) => instance.state === ExtensionState.ACTIVE
    );

    // 并行停用所有活动插件
    await Promise.allSettled(
      activeInstances.map((instance) =>
        this.deactivateExtension(instance.extension.id)
      )
    );

    // 并行卸载所有就绪插件
    const readyInstances = this.getAllInstances().filter(
      (instance) => instance.state === ExtensionState.READY
    );

    await Promise.allSettled(
      readyInstances.map((instance) =>
        this.unloadExtension(instance.extension.id)
      )
    );

    console.log("[ExtensionManager] Shutdown completed");
  }
}
