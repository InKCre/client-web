import { z } from "zod";
import { Z } from "zod-class";
import { DBAPIClient, CoreAPIClient } from "../api";
import { makeNumberProp, makeObjectProp } from "@/utils/vue-props";
import dayjs from "dayjs";
import type { DropdownOption } from "@inkcre/web-design";
import { zinstance } from "../base";

export class CollectAt extends Z.class({
  // 0 (Monday) to 6 (Sunday), null to run on every day
  day_of_week: z.int().min(0).max(6).nullable().default(null),
  // null to run on every hour
  hour: z.int().min(0).max(23).nullable().default(null),
  minute: z.int().min(0).max(59).default(0),
}) {
  static WEEKDAYS = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  static format(value: CollectAt): string {
    const weekday =
      value.day_of_week === null
        ? "every day"
        : CollectAt.WEEKDAYS[value.day_of_week];
    const isEveryHour = value.hour === null;
    const timeDescription = isEveryHour
      ? `every hour at minute ${value.minute}`
      : `at ${dayjs().hour(value.hour!).minute(value.minute).format("HH:mm")}`;
    return `every ${weekday} ${timeDescription}`;
  }

  static get DayOfWeekOptions(): DropdownOption[] {
    return [
      { label: "Every day", value: -1 },
      ...CollectAt.WEEKDAYS.map((weekday, index) => ({
        label: weekday,
        value: index,
      })),
    ];
  }

  static get HourOptions(): DropdownOption[] {
    return [
      { label: "every hour", value: -1 },
      ...Array.from({ length: 24 }, (_, i) => ({
        label: i.toString().padStart(2, "0"),
        value: i,
      })),
    ];
  }

  static get MinuteOptions(): DropdownOption[] {
    return Array.from({ length: 60 }, (_, i) => ({
      label: i.toString().padStart(2, "0"),
      value: i,
    }));
  }
}

export type SourceTypeRef = string;
export const SourceTypeRefZ = z.string();

export class SourceType extends Z.class({
  id: SourceTypeRefZ,
  description: z.string(),
  config_schema: z.looseObject({}).default(() => ({})),
}) {
  static dbApi: DBAPIClient = new DBAPIClient("sources_types", SourceType);

  static async get(id: SourceTypeRef): Promise<SourceType> {
    return new SourceType(
      (await this.dbApi.from().select().eq("id", id).single()).data!
    );
  }

  static async getAll(): Promise<SourceType[]> {
    return (await this.dbApi.from().select()).data!.map(
      (d) => new SourceType(d)
    );
  }
}

export type SourceRef = number;
export const makeSourceProp = (v?: any) => makeObjectProp<Source>(v);
export const makeSourceRefProp = (v?: any) => makeNumberProp<SourceRef>(v);
export const SourceRefZ = z.number();

export class Source extends Z.class({
  id: SourceRefZ,
  type: SourceTypeRefZ,
  nickname: z.string(),
  config: z.looseObject({}).default(() => ({})),
  collect_at: zinstance<CollectAt>(CollectAt).nullable(),
}) {
  static dbApi: DBAPIClient = new DBAPIClient("sources", Source);
  static coreApi: CoreAPIClient<Source> = new CoreAPIClient("/source", Source);

  static async get(id: SourceRef): Promise<Source> {
    return new Source(
      (await this.dbApi.from().select().eq("id", id).single()).data!
    );
  }

  static async getAll(): Promise<Source[]> {
    return (await this.dbApi.from().select()).data!.map((d) => new Source(d));
  }

  /**
   * Get available source types
   */
  static async getTypes(): Promise<string[]> {
    return Source.coreApi.request<string[]>({
      method: "GET",
      path: "/types",
    });
  }

  public async save(): Promise<Source> {
    return Source.dbApi.first(await Source.dbApi.from().upsert(this).select());
  }

  async collect(options: { full?: boolean } = {}): Promise<void> {
    await Source.coreApi.request<any[]>({
      method: "GET",
      path: `/${this.id}/collect`,
      query: options,
    });
  }

  async delete(): Promise<void> {
    await Source.dbApi.from().delete().eq("id", this.id);
  }
}

export class SourceForm extends Z.class({
  ...Source.shape,
  id: z.undefined(),
}) {
  public async create() {
    return new Source(
      (await Source.dbApi.from().insert(this).select().single()).data!
    );
  }
}

export enum SourceCollectJobStatus {
  PENDING = "pending",
  RUNNING = "running",
  FINISHED = "finished",
  FAILED = "failed",
}

export class SourceCollectJob extends Z.class({
  id: z.number(),
  source: SourceRefZ,
  created_at: z.date().default(() => new Date()),
  started_at: z.date().nullable().default(null),
  closed_at: z.date().nullable().default(null),
  status: z
    .enum(SourceCollectJobStatus)
    .default(SourceCollectJobStatus.PENDING),
  state: z.looseObject({}).default(() => ({})),
}) {
  static dbApi: DBAPIClient = new DBAPIClient(
    "sources_collect_jobs",
    SourceCollectJob
  );
  static coreApi: CoreAPIClient<SourceCollectJob> = new CoreAPIClient(
    "/source/collect-job",
    SourceCollectJob
  );

  static async get(id: number): Promise<SourceCollectJob> {
    const result = await this.dbApi.from().select().eq("id", id).single();
    if (!result.data) {
      throw new Error(`SourceCollectJob with id ${id} not found`);
    }
    return new SourceCollectJob(result.data);
  }

  static async getAll(): Promise<SourceCollectJob[]> {
    const result = await this.dbApi.from().select();
    return (result.data || []).map((d) => new SourceCollectJob(d));
  }

  static async getBySource(sourceId: SourceRef): Promise<SourceCollectJob[]> {
    const result = await this.dbApi.from().select().eq("source", sourceId);
    return (result.data || []).map((d) => new SourceCollectJob(d));
  }

  async stop(): Promise<void> {
    await SourceCollectJob.coreApi.request({
      method: "POST",
      path: `/${this.id}/stop`,
    });
  }

  async retry(): Promise<SourceCollectJob> {
    return new SourceCollectJob(
      await SourceCollectJob.coreApi.request({
        method: "POST",
        path: `/${this.id}/retry`,
      })
    );
  }

  async save(): Promise<SourceCollectJob> {
    return SourceCollectJob.dbApi.first(
      await SourceCollectJob.dbApi.from().upsert(this).select()
    );
  }
}

export class SourceCollectJobForm extends Z.class({
  ...SourceCollectJob.shape,
  id: z.undefined(),
}) {
  public async create() {
    return new SourceCollectJob(
      (await SourceCollectJob.dbApi.from().insert(this).select().single()).data!
    );
  }
}
