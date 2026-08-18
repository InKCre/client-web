import { z } from 'zod'
import { Z } from 'zod-class'
import { DBAPIClient } from '../base/db-api'
import { JobManager } from '../job'

const JsonObjectSchema = z.record(z.string(), z.unknown())

export class Cron extends Z.class({
  id: z.number().int(),
  schedule: z.string(),
  enabled: z.boolean(),
  job_type: z.string(),
  job_parameters: JsonObjectSchema,
  job_timeout_seconds: z.number().int().positive().nullable(),
  last_job: z.number().int().nullable(),
  last_scheduled_for: z.coerce.date().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
}) {
  static dbApi = new DBAPIClient<'crons', Cron>('crons', Cron)

  static async getAll(): Promise<Cron[]> {
    return ((await this.dbApi.from().select().order('created_at')).data ?? []).map((item) =>
      Cron.parse(item)
    )
  }

  static async getBySource(source: number): Promise<Cron[]> {
    const result = await this.dbApi
      .from()
      .select()
      .contains('job_parameters', { source })
      .order('created_at')
    return (result.data ?? []).map((item) => Cron.parse(item))
  }

  async runNow() {
    return JobManager.create(
      this.job_type,
      this.job_parameters,
      this.job_timeout_seconds ?? undefined
    )
  }

  async update(form: CronForm): Promise<Cron> {
    return Cron.parse(
      (
        await Cron.dbApi
          .from()
          .update({
            schedule: form.schedule,
            enabled: form.enabled,
            job_type: form.job_type,
            job_parameters: form.job_parameters as never,
            job_timeout_seconds: form.job_timeout_seconds,
          })
          .eq('id', this.id)
          .select()
          .single()
      ).data
    )
  }

  async delete(): Promise<void> {
    await Cron.dbApi.from().delete().eq('id', this.id)
  }
}

export class CronForm extends Z.class({
  schedule: z.string(),
  enabled: z.boolean().default(true),
  job_type: z.string(),
  job_parameters: JsonObjectSchema,
  job_timeout_seconds: z.number().int().positive().nullable().default(null),
}) {
  async create(): Promise<Cron> {
    return Cron.parse((await Cron.dbApi.insert(this).select().single()).data)
  }
}
