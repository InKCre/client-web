// vite-plugin-extension-dev.ts
import { Plugin, ProxyOptions, ViteDevServer } from "vite";
import path from "path";
import fs from "fs";
import { spawn, ChildProcess } from "child_process";
import net from "net";
import os from "os";

interface ExtensionDevOptions {
  extensionsDir?: string;
  activeExtensions: string[];
}

// --- 工具函数 ---

async function getPort(startPort = 3000): Promise<number> {
  const isAvailable = (port: number) => {
    return new Promise((resolve) => {
      const server = net.createServer();
      server.once("error", () => resolve(false));
      server.once("listening", () => {
        server.close();
        resolve(true);
      });
      server.listen(port);
    });
  };

  let port = startPort;
  while (!(await isAvailable(port))) {
    port++;
  }
  return port;
}

/**
 * 强力杀死进程（兼容 Windows shell: true）
 */
function killProcess(pid: number) {
  try {
    if (os.platform() === "win32") {
      // Windows 下 spawn 开启 shell: true 后，需要杀掉整个进程树
      spawn("taskkill", ["/pid", pid.toString(), "/f", "/t"]);
    } else {
      process.kill(pid, "SIGTERM");
    }
  } catch (e) {
    // 忽略进程已不存在的错误
  }
}

/**
 * 核心插件工厂函数
 */
export async function useExtensionDevServer(options: ExtensionDevOptions) {
  const rootDir = process.cwd();
  const extDir = path.resolve(rootDir, options.extensionsDir || "extensions");

  // 1. 预计算阶段：先计算好端口和 Proxy 配置
  //    注意：这里不要启动进程！只做配置准备。
  const extConfigs: Array<{ id: string; dir: string; port: number }> = [];
  const proxyConfig: Record<string, ProxyOptions> = {};

  if (options.activeExtensions && options.activeExtensions.length > 0) {
    let portCursor = 4000;

    // 串行获取端口，避免冲突
    for (const extId of options.activeExtensions) {
      const activeExtDir = path.join(extDir, extId);

      if (!fs.existsSync(activeExtDir)) {
        console.warn(`⚠️ [Extension Dev] Directory not found: ${activeExtDir}`);
        continue;
      }

      const port = await getPort(portCursor);
      portCursor = port + 1;

      extConfigs.push({
        id: extId,
        dir: activeExtDir,
        port: port,
      });

      // 生成 Proxy 配置
      proxyConfig[`^/${extId}/client-web`] = {
        target: `http://localhost:${port}`,
        changeOrigin: true,
      };
    }
  }

  const plugin: Plugin = {
    name: "vite-plugin-extension-manager",

    // 2. 将 Proxy 配置注入 Vite
    config(config) {
      return {
        server: {
          proxy: {
            ...config.server?.proxy,
            ...proxyConfig,
          },
        },
      };
    },

    // 3. 服务启动阶段：真正启动子进程并管理生命周期
    configureServer(server: ViteDevServer) {
      // 当前实例管理的子进程列表
      const currentProcesses: ChildProcess[] = [];

      // A. 定义启动逻辑
      const startAll = () => {
        if (extConfigs.length === 0) return;

        console.log(
          `\n🚀 [Extension Dev] Starting ${extConfigs.length} extensions...`
        );

        extConfigs.forEach(({ id, dir, port }) => {
          console.log(`   -> [${id}] spawning on port ${port}...`);

          const child = spawn(
            "npx",
            ["vite", "--port", String(port), "--strictPort"],
            {
              cwd: dir,
              stdio: "inherit",
              shell: true, // 注意：shell: true 在 Windows 下会导致 kill 困难，见下方 killProcess
            }
          );

          currentProcesses.push(child);
        });
      };

      // B. 定义清理逻辑
      const cleanup = () => {
        if (currentProcesses.length > 0) {
          console.log(
            `🛑 [Extension Dev] Stopping ${currentProcesses.length} subprocesses...`
          );
          currentProcesses.forEach((p) => {
            if (p.pid) killProcess(p.pid);
          });
          // 清空数组
          currentProcesses.length = 0;
        }
      };

      // C. 启动子进程
      startAll();

      // D. 监听当前 Server 关闭事件 (Vite 重启或退出时触发)
      // 这是实现自动重载的关键：Vite 重启 = 旧 Server Close + 新 Server Start
      server.httpServer?.on("close", cleanup);

      // E. 兜底：处理主进程意外退出
      // 虽然 server.close 通常够用，但为了防止 Ctrl+C 残留，做双重保险
      process.once("exit", cleanup);
    },
  };

  return {
    plugin,
  };
}
