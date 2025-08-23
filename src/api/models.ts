import { BlockSchema, RelationSchema, type BlockData, type RelationData } from "./schemas";

/**
 * Block 类 - 用于存储和操作块数据
 */
export class Block {
  public readonly id: number;
  public readonly updated_at: string;
  public readonly storage: "url" | null;
  public readonly resolver: string;
  public readonly content: string;

  constructor(data: BlockData) {
    // 使用 zod 验证数据
    const validated = BlockSchema.parse(data);

    this.id = validated.id;
    this.updated_at = validated.updated_at;
    this.storage = validated.storage;
    this.resolver = validated.resolver;
    this.content = validated.content;
  }

  /**
   * 从原始数据创建 Block 实例
   */
  static fromData(data: unknown): Block {
    return new Block(BlockSchema.parse(data));
  }

  /**
   * 创建多个 Block 实例
   */
  static fromArray(data: unknown[]): Block[] {
    return data.map((item) => Block.fromData(item));
  }

  /**
   * 获取格式化的更新时间
   */
  getFormattedDate(): string {
    return new Date(this.updated_at).toLocaleString();
  }

  /**
   * 检查是否有嵌入向量
   */
  hasEmbedding(): boolean {
    return this.embedding !== null && this.embedding.length > 0;
  }

  /**
   * 获取内容预览（截取前100个字符）
   */
  getContentPreview(maxLength: number = 100): string {
    if (this.content.length <= maxLength) {
      return this.content;
    }
    return this.content.substring(0, maxLength) + "...";
  }

  /**
   * 检查是否为URL类型的存储
   */
  isUrlStorage(): boolean {
    return this.storage === "url";
  }

  /**
   * 转换为普通对象
   */
  toPlainObject(): BlockData {
    return {
      id: this.id,
      updated_at: this.updated_at,
      storage: this.storage,
      resolver: this.resolver,
      content: this.content,
      embedding: this.embedding,
    };
  }

  /**
   * 创建用于更新的数据对象
   */
  toUpdateData(): Omit<BlockData, "id"> {
    return {
      updated_at: this.updated_at,
      storage: this.storage,
      resolver: this.resolver,
      content: this.content,
      embedding: this.embedding,
    };
  }

  /**
   * 检查两个块是否相等
   */
  equals(other: Block): boolean {
    return this.id === other.id;
  }

  /**
   * 获取块的描述字符串
   */
  toString(): string {
    return `Block(id=${this.id}, resolver=${this.resolver}, content="${this.getContentPreview(
      50,
    )}")`;
  }
}

/**
 * Relation 类 - 用于存储和操作关系数据
 */
export class Relation {
  public readonly id: number;
  public readonly updated_at: string;
  public readonly from_: number;
  public readonly to_: number;
  public readonly content: string;

  constructor(data: RelationData) {
    // 使用 zod 验证数据
    const validated = RelationSchema.parse(data);

    this.id = validated.id;
    this.updated_at = validated.updated_at;
    this.from_ = validated.from_;
    this.to_ = validated.to_;
    this.content = validated.content;
  }

  /**
   * 从原始数据创建 Relation 实例
   */
  static fromData(data: unknown): Relation {
    return new Relation(RelationSchema.parse(data));
  }

  /**
   * 创建多个 Relation 实例
   */
  static fromArray(data: unknown[]): Relation[] {
    return data.map((item) => Relation.fromData(item));
  }

  /**
   * 获取格式化的更新时间
   */
  getFormattedDate(): string {
    return new Date(this.updated_at).toLocaleString();
  }

  /**
   * 获取内容预览
   */
  getContentPreview(maxLength: number = 50): string {
    if (this.content.length <= maxLength) {
      return this.content;
    }
    return this.content.substring(0, maxLength) + "...";
  }

  /**
   * 检查关系是否连接指定的块
   */
  connectsBlock(blockId: number): boolean {
    return this.from_ === blockId || this.to_ === blockId;
  }

  /**
   * 检查是否为从指定块出发的关系
   */
  isFromBlock(blockId: number): boolean {
    return this.from_ === blockId;
  }

  /**
   * 检查是否为到达指定块的关系
   */
  isToBlock(blockId: number): boolean {
    return this.to_ === blockId;
  }

  /**
   * 获取关系的另一端块ID
   */
  getOtherBlockId(blockId: number): number | null {
    if (this.from_ === blockId) return this.to_;
    if (this.to_ === blockId) return this.from_;
    return null;
  }

  /**
   * 获取关系方向
   */
  getDirection(fromBlockId: number): "outgoing" | "incoming" | "unknown" {
    if (this.from_ === fromBlockId) return "outgoing";
    if (this.to_ === fromBlockId) return "incoming";
    return "unknown";
  }

  /**
   * 转换为普通对象
   */
  toPlainObject(): RelationData {
    return {
      id: this.id,
      updated_at: this.updated_at,
      from_: this.from_,
      to_: this.to_,
      content: this.content,
    };
  }

  /**
   * 检查两个关系是否相等
   */
  equals(other: Relation): boolean {
    return this.id === other.id;
  }

  /**
   * 获取关系的描述字符串
   */
  toString(): string {
    return `Relation(id=${this.id}, from=${this.from_} -> to=${
      this.to_
    }, content="${this.getContentPreview()}")`;
  }
}
