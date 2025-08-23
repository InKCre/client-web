import { z } from "zod";

/**
 * Block 数据模式
 */
export const BlockSchema = z.object({
  id: z.number(),
  updated_at: z.string(),
  storage: z.union([z.literal("url"), z.null()]),
  resolver: z.string(),
  content: z.string(),
});

/**
 * Relation 数据模式
 */
export const RelationSchema = z.object({
  id: z.number(),
  updated_at: z.string(),
  from_: z.number(),
  to_: z.number(),
  content: z.string(),
});

/**
 * 创建块的请求数据模式
 */
export const CreateBlockRequestSchema = z.object({
  storage: z.union([z.literal("url"), z.null()]),
  resolver: z.string(),
  content: z.string(),
});

/**
 * 更新块的请求数据模式
 */
export const UpdateBlockRequestSchema = z.object({
  id: z.number(),
  updated_at: z.string(),
  storage: z.union([z.literal("url"), z.null()]).optional(),
  resolver: z.string().optional(),
  content: z.string().optional(),
});

/**
 * 创建关系的请求数据模式
 */
export const CreateRelationRequestSchema = z.object({
  from_: z.number(),
  to_: z.number(),
  content: z.string(),
});

/**
 * 获取最近块的查询参数模式
 */
export const GetRecentBlocksParamsSchema = z
  .object({
    num: z.number().optional(),
    resolver: z.string().optional(),
  })
  .optional();

/**
 * 向量检索块的查询参数模式
 */
export const GetBlocksByEmbeddingParamsSchema = z.object({
  block_id: z.number(),
  num: z.number().optional(),
});

/**
 * 块遍历的查询参数模式
 */
export const GetBlockIterationParamsSchema = z
  .object({
    exclude_start_block: z.boolean().optional(),
    max_depth: z.number().optional(),
  })
  .optional();

/**
 * 块遍历响应模式
 */
export const BlockIterationResponseSchema = z.object({
  blocks: z.array(z.number()),
  relations: z.array(z.number()),
});

/**
 * API 响应包装模式
 */
export const ApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    data: dataSchema,
    message: z.string().optional(),
  });

/**
 * 分页查询参数模式
 */
export const PaginationParamsSchema = z
  .object({
    page: z.number().optional(),
    limit: z.number().optional(),
  })
  .optional();

/**
 * 分页响应模式
 */
export const PaginatedResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    data: z.array(dataSchema),
    total: z.number(),
    page: z.number(),
    limit: z.number(),
  });

// 导出类型
export type BlockData = z.infer<typeof BlockSchema>;
export type RelationData = z.infer<typeof RelationSchema>;
export type CreateBlockRequest = z.infer<typeof CreateBlockRequestSchema>;
export type UpdateBlockRequest = z.infer<typeof UpdateBlockRequestSchema>;
export type CreateRelationRequest = z.infer<typeof CreateRelationRequestSchema>;
export type GetRecentBlocksParams = z.infer<typeof GetRecentBlocksParamsSchema>;
export type GetBlocksByEmbeddingParams = z.infer<typeof GetBlocksByEmbeddingParamsSchema>;
export type GetBlockIterationParams = z.infer<typeof GetBlockIterationParamsSchema>;
export type BlockIterationResponse = z.infer<typeof BlockIterationResponseSchema>;
