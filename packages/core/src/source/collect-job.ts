import { z } from 'zod'
import { Z } from 'zod-class'
import { DBAPIClient } from '../base/db-api'
import { SourceRefZ, type SourceRef } from './source'
import { Log } from '../obsrv/log'

export const SourceCollectJobStatus = {
  PENDING: 'pending',
  RUNNING: 'running',
  FINISHED: 'finished',
  FAILED: 'failed',
} as const

export type SourceCollectJobRef = number
export const SourceCollectJobRefZ = z.number()

export class SourceCollectJob extends Z.class({
  id: SourceCollectJobRefZ,
  source: SourceRefZ,
  created_at: z.coerce.date().default(() => new Date()),
  started_at: z.coerce.date().nullable().default(null),
  closed_at: z.coerce.date().nullable().default(null),
  status: z
    .enum([
      SourceCollectJobStatus.PENDING,
      SourceCollectJobStatus.RUNNING,
      SourceCollectJobStatus.FINISHED,
      SourceCollectJobStatus.FAILED,
    ])
    .default(SourceCollectJobStatus.PENDING),
  state: z.looseObject({}).default(() => ({})),
  config: z.looseObject({}).default(() => ({})),
}) {
  static dbApi: DBAPIClient = new DBAPIClient('sources_collect_jobs', SourceCollectJob)

  static async get(id: SourceCollectJobRef): Promise<SourceCollectJob> {
    return new SourceCollectJob((await this.dbApi.from().select().eq('id', id).single()).data!)
  }

  static async getBySource(
    sourceId: SourceRef,
    options?: {
      limit?: number
      offset?: number
      order?: 'asc' | 'desc'
    }
  ): Promise<{ data: SourceCollectJob[]; count: number }> {
    const { limit = 10, offset = 0, order = 'desc' } = options || {}
    const query = this.dbApi
      .from()
      .select('*', { count: 'exact' })
      .eq('source', sourceId)
      .order('created_at', { ascending: order === 'asc' })
      .range(offset, offset + limit - 1)

    const result = await query
    return {
      data: (result.data || []).map((d) => new SourceCollectJob(d)),
      count: result.count || 0,
    }
  }

  static async getLatestOpenBySource(sourceId: SourceRef): Promise<SourceCollectJob | null> {
    const result = await this.dbApi
      .from()
      .select()
      .eq('source', sourceId)
      .in('status', [SourceCollectJobStatus.PENDING, SourceCollectJobStatus.RUNNING])
      .order('created_at', { ascending: false })
      .limit(1)

    if (result.data && result.data.length > 0) {
      return new SourceCollectJob(result.data[0])
    }
    return null
  }

  public async getLogs(options?: { limit?: number; cursor?: number }): Promise<Log[]> {
    return Log.getByTraceId(`source_collect_job.${this.id}`, options)
  }

  static isFinalStatus(status: string): boolean {
    return status === SourceCollectJobStatus.FINISHED || status === SourceCollectJobStatus.FAILED
  }

  get isFinal(): boolean {
    return SourceCollectJob.isFinalStatus(this.status)
  }
}

export class SourceCollectJobForm extends Z.class({
  ...SourceCollectJob.shape,
  id: z.undefined(),
}) {
  public async create() {
    return new SourceCollectJob(
      (await SourceCollectJob.dbApi.from().insert(this).select().single()).data!
    )
  }
}
