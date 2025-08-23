// 重新导出新的 schemas 和 models
export * from "./schemas";
export { Block, Relation } from "./models";

// 保持向后兼容，重新导出原有的类型接口
export type { Block as BlockInterface } from "@/types/blocks";
export type { Relation as RelationInterface } from "@/types/relations";

/**
 * API响应包装类型
 */
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

/**
 * 分页查询参数
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
}

/**
 * 分页响应结果
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
