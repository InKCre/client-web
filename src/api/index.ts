// 导出API客户端和错误类型
export { ApiClient, apiClient, ApiError, ValidationError } from "./client";

// 导出API类和实例
export { BlocksApi, blocksApi } from "./blocks";
export { RelationsApi, relationsApi } from "./relations";

// 导出数据模型类
export { Block, Relation } from "./models";

// 导出 zod schemas
export * from "./schemas";

// 导出组合式函数
export { useBlocks, useRelations, useInKCreAPI } from "./composables";

// 导出类型定义
export type * from "./types";

// 导入实例以创建统一的API对象
import { blocksApi } from "./blocks";
import { relationsApi } from "./relations";

// 创建统一的API对象
export const api = {
  blocks: blocksApi,
  relations: relationsApi,
};
