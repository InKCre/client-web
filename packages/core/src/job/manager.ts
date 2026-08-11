import { z } from 'zod'
import { Job, JobStatus, JobType, type JobRef, type JobTypeRef } from './job'

export interface JobHandler<Parameters extends z.ZodType = z.ZodType> {
  parameters: Parameters
  canHandle(parameters: z.output<Parameters>): boolean | Promise<boolean>
  handle(job: Job, parameters: z.output<Parameters>, signal: AbortSignal): Promise<void>
}

export class DuplicateJobHandlerError extends Error {}

export class JobManager {
  private static handlers = new Map<JobTypeRef, JobHandler>()
  private static active = new Set<JobRef>()
  private static worker: ReturnType<typeof setInterval> | null = null

  static registerHandler<Parameters extends z.ZodType>(
    type: JobTypeRef,
    handler: JobHandler<Parameters>
  ): void {
    const existing = this.handlers.get(type)
    if (existing === handler) return
    if (existing) throw new DuplicateJobHandlerError(`Job type ${type} already has a handler`)
    this.handlers.set(type, handler)
  }

  static unregisterHandler(type: JobTypeRef): void {
    this.handlers.delete(type)
  }

  static async create(
    type: JobTypeRef,
    parameters: Record<string, unknown>,
    timeoutSeconds?: number
  ): Promise<Job> {
    const jobType = await JobType.get(type)
    const handler = this.handlers.get(type)
    const normalized = handler ? handler.parameters.parse(parameters) : parameters
    const timeout = timeoutSeconds ?? jobType.default_timeout_seconds
    if (!Number.isInteger(timeout) || timeout <= 0) {
      throw new TypeError('Job timeout must be a positive number of seconds')
    }
    const result = await Job.dbApi
      .insert({
        type,
        parameters: normalized,
        timeout_seconds: timeout,
        state: {},
      })
      .select()
      .single()
    return Job.parse(result.data)
  }

  private static async prepare(job: Job): Promise<[JobHandler, unknown] | null> {
    const handler = this.handlers.get(job.type)
    if (!handler) return null
    const parsed = handler.parameters.safeParse(job.parameters)
    if (!parsed.success || !(await handler.canHandle(parsed.data))) return null
    return [handler, parsed.data]
  }

  private static async claim(job: Job): Promise<Job | null> {
    const result = await Job.dbApi
      .update({ status: JobStatus.RUNNING })
      .eq('id', job.id)
      .eq('status', JobStatus.PENDING)
      .select()
      .maybeSingle()
    return result.data ? Job.parse(result.data) : null
  }

  private static async close(job: Job, status: string): Promise<boolean> {
    const result = await Job.dbApi
      .update({ status, state: job.state })
      .eq('id', job.id)
      .eq('status', JobStatus.RUNNING)
      .select('id')
    return (result.data?.length ?? 0) > 0
  }

  static async run(id: JobRef): Promise<boolean> {
    if (this.active.has(id)) return false
    const candidate = await Job.get(id)
    const prepared = await this.prepare(candidate)
    if (!prepared) return false
    const claimed = await this.claim(candidate)
    if (!claimed) return false

    this.active.add(id)
    const [handler, parameters] = prepared
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), claimed.timeout_seconds * 1000)
    try {
      await handler.handle(claimed, parameters, controller.signal)
      await this.close(
        claimed,
        controller.signal.aborted ? JobStatus.TIMED_OUT : JobStatus.FINISHED
      )
    } catch (error) {
      claimed.state = {
        ...claimed.state,
        error: error instanceof Error ? error.message : String(error),
      }
      await this.close(claimed, controller.signal.aborted ? JobStatus.TIMED_OUT : JobStatus.FAILED)
    } finally {
      clearTimeout(timeout)
      this.active.delete(id)
    }
    return true
  }

  static async check(): Promise<void> {
    const pending = await Job.getAll({ status: JobStatus.PENDING, limit: 100 })
    for (const job of pending) {
      if (this.active.has(job.id) || !(await this.prepare(job))) continue
      void this.run(job.id)
    }
  }

  static startWorker(intervalMilliseconds = 30_000): void {
    if (this.worker) return
    void this.check()
    this.worker = setInterval(() => void this.check(), intervalMilliseconds)
  }

  static stopWorker(): void {
    if (!this.worker) return
    clearInterval(this.worker)
    this.worker = null
  }
}
