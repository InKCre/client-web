import { z } from "zod";
import { Z } from "zod-class";
import { DBAPIClient, CoreAPIClient } from "../api";
import { makeNumberProp, makeObjectProp } from "@/utils/vue-props";
import dayjs from "dayjs";
import type { DropdownOption } from "@/components/common/InkDropdown/InkDropdown";
import { zinstance } from "../base";

const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export class CollectAt extends Z.class({
  // 0 (Sunday) to 6 (Saturday)
  day_of_week: z.number().min(0).max(6).nullable().default(null),
  hour: z.number().min(0).max(23).nullable().default(null),
  minute: z.number().min(0).max(59).nullable().default(null),
}) {
  static format(value: CollectAt | null): string {
    if (
      value === null ||
      value.day_of_week === null ||
      value.hour === null ||
      value.minute === null
    ) {
      return "Not set";
    }
    const weekday = WEEKDAYS[value.day_of_week];
    const time = dayjs().hour(value.hour).minute(value.minute).format("HH:mm");
    return `every ${weekday} ${time}`;
  }

  static get DayOfWeekOptions(): DropdownOption[] {
    return WEEKDAYS.map((weekday, index) => ({ label: weekday, value: index }));
  }
}

export type SourceTypeRef = string;
export const SourceTypeRefZ = z.string();

export class SourceType extends Z.class({
  id: SourceTypeRefZ,
  description: z.string(),
}) {
  static dbApi: DBAPIClient = new DBAPIClient("sources_types", SourceType);

  static async getAll(): Promise<SourceType[]> {
    return (await this.dbApi.select()).data!.map((d) => new SourceType(d));
  }
}

export type SourceRef = number;
export const makeSourceProp = (v?: any) => makeObjectProp<Source>(v);
export const makeSourceRefProp = (v?: any) => makeNumberProp<SourceRef>(v);
export const SourceRefZ = z.number();

export class Source extends Z.class({
  id: SourceRefZ,
  type: z.string(),
  nickname: z.string(),
  config: z.looseObject({}).nullable().optional(),
  collect_at: zinstance(CollectAt).nullable(),
}) {
  static dbApi: DBAPIClient = new DBAPIClient("sources", Source);
  static coreApi: CoreAPIClient<Source> = new CoreAPIClient("/source", Source);

  static async get(id: SourceRef): Promise<Source> {
    return new Source((await this.dbApi.select().eq("id", id).single()).data!);
  }

  static async getAll(): Promise<Source[]> {
    return (await this.dbApi.select()).data!.map((d) => new Source(d));
  }

  /**
   * Get available source types
   */
  static async getTypes(): Promise<string[]> {
    return Source.coreApi.requestHttp<string[]>({
      method: "GET",
      path: "/types",
    });
  }

  public async update(): Promise<Source> {
    return Source.dbApi.first(await Source.dbApi.upsert(this).select());
  }

  async collect(options: { full?: boolean } = {}): Promise<void> {
    await Source.coreApi.requestHttp<any[]>({
      method: "GET",
      path: `/${this.id}/collect`,
      query: options,
    });
  }

  async delete(): Promise<void> {
    await Source.dbApi.delete().eq("id", this.id);
  }
}

export class SourceForm extends Z.class({
  ...Source.shape,
  id: z.undefined(),
}) {
  public async create() {
    return new Source(
      (await Source.dbApi.insert(this).select().single()).data!
    );
  }
}
