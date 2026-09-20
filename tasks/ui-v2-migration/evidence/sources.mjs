// I3 的任务限定验收：真实构建页面，隔离 PostgREST 响应，不进入正式测试框架。
import { expect } from '@playwright/test'
import { writeFile } from 'node:fs/promises'

export async function verifySources({
  page,
  source,
  job,
  dates,
  evidence,
  navigate,
  expectContained,
}) {
  let sources = [
    {
      ...source,
      config: { limit: 20, target: 'https://example.invalid/bookmarks/完整配置不会在列表重复陈列' },
    },
    { ...source, id: 8, nickname: null, config: { limit: 10 } },
    { ...source, id: 9, nickname: '阅读清单', config: { limit: 50 } },
  ]
  let jobs = [job, { ...job, id: 10, parameters: { source: 8 }, status: 'running' }]
  let crons = []
  let nextId = 20
  const types = [
    {
      id: source.type,
      description: 'Bookmark fixture',
      config_schema: {
        type: 'object',
        properties: { limit: { type: 'integer', minimum: 1 } },
        required: ['limit'],
      },
      collect_config_schema: {
        type: 'object',
        properties: { batchSize: { type: 'integer', minimum: 1 } },
        required: ['batchSize'],
      },
      backfill_config_schema: null,
    },
  ]
  types.push({
    id: 'fixture.alternative.Source',
    description: 'Different config contract',
    config_schema: { type: 'object' },
    collect_config_schema: { type: 'object' },
    backfill_config_schema: { type: 'object' },
  })
  const writes = []
  let fault
  function intercept(key, method, status = 200) {
    let resume, received
    const held = new Promise((resolve) => {
      resume = resolve
    })
    const started = new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`Expected request ${method} ${key}`)), 10000)
      received = () => {
        clearTimeout(timer)
        resolve()
      }
    })
    fault = { key, method, status, held, received }
    return { started, resume }
  }
  async function handler(route) {
    const request = route.request(),
      url = new URL(request.url()),
      kind = url.pathname.split('/').at(-1)
    if (!['sources', 'sources_types', 'jobs', 'job_types', 'crons'].includes(kind))
      return route.fallback()
    const method = request.method()
    const body = method === 'POST' ? request.postDataJSON() : null
    const id = url.searchParams.get('id')?.replace('eq.', '') ?? body?.id
    const filter = url.searchParams.get('parameters') ?? url.searchParams.get('job_parameters')
    const sourceId = filter ? JSON.parse(filter.slice(3)).source : null
    const key = `${kind}${id ? `:${id}` : sourceId ? `:source:${sourceId}` : ''}`
    if (method !== 'GET') writes.push({ key, method, body })
    if (fault?.key === key && fault.method === method) {
      const current = fault
      fault = null
      current.received()
      await current.held
      if (current.status !== 200)
        return route.fulfill({
          status: current.status,
          json: { code: '42501', message: 'Controlled database rejection' },
          headers: { 'access-control-allow-origin': '*' },
        })
    }
    let data
    if (kind === 'sources') {
      if (method === 'POST') {
        const saved = { ...body, id: body.id ?? nextId++, block: null, ...dates }
        sources = [...sources.filter((item) => item.id !== saved.id), saved]
        data = [saved]
      } else if (method === 'DELETE') {
        sources = sources.filter((item) => item.id !== Number(id))
        data = []
      } else data = sources.filter((item) => !id || item.id === Number(id))
    } else if (kind === 'sources_types') data = types
    else if (kind === 'job_types')
      data = [
        {
          id,
          description: 'Fixture collection',
          parameters_schema: {},
          default_timeout_seconds: 60,
        },
      ]
    else if (kind === 'jobs') {
      if (method === 'POST') {
        const created = {
          ...body,
          id: nextId++,
          status: 'pending',
          created_at: dates.created_at,
          started_at: null,
          closed_at: null,
        }
        jobs = [created, ...jobs]
        data = [created]
      } else {
        const filter = url.searchParams.get('parameters')
        const sourceId = filter ? JSON.parse(filter.slice(3)).source : null
        data = jobs.filter(
          (item) =>
            (!id || item.id === Number(id)) && (!sourceId || item.parameters.source === sourceId)
        )
      }
    } else if (kind === 'crons') {
      if (method === 'POST') {
        const created = {
          ...body,
          id: nextId++,
          last_job: null,
          last_scheduled_for: null,
          ...dates,
        }
        crons.push(created)
        data = [created]
      } else if (method === 'DELETE') {
        crons = crons.filter((item) => item.id !== Number(id))
        data = []
      } else {
        const filter = url.searchParams.get('job_parameters')
        const sourceId = filter ? JSON.parse(filter.slice(3)).source : null
        data = crons.filter((item) => !sourceId || item.job_parameters.source === sourceId)
      }
    }
    if (request.headers().accept?.includes('vnd.pgrst.object') && Array.isArray(data))
      data = data[0] ?? null
    return route.fulfill({ json: data, headers: { 'access-control-allow-origin': '*' } })
  }
  const pattern = 'https://api-migration.invalid/rest/**'
  await page.route(pattern, handler)
  const detail = page.locator('.source-view__details')
  const editor = detail.locator('.cm-content')
  const save = detail.getByRole('button', { name: '保存', exact: true })
  const sourceLink = () => page.locator('#source-7 .source-card__name')
  async function backToList() {
    await navigate('/')
    await navigate('/sources')
  }
  async function rejectRead(key, visit, region, text) {
    const gate = intercept(key, 'GET', 403)
    await visit()
    await gate.started
    gate.resume()
    await expect(region.getByRole('alert')).toContainText(text)
    await region.getByRole('button', { name: '重试', exact: true }).click()
    await expect(region.getByRole('alert')).toHaveCount(0)
  }
  try {
    await page.setViewportSize({ width: 1280, height: 1000 })
    await page.emulateMedia({ colorScheme: 'light' })
    const listLoading = intercept('sources', 'GET')
    await backToList()
    await listLoading.started
    await expect(page.locator('.sources-view').getByRole('status')).toBeVisible()
    listLoading.resume()
    await expect(page.locator('.source-card')).toHaveCount(3)
    await expect(page.locator('.sources-view .cm-editor')).toHaveCount(0)
    await expect(
      page.locator('.source-card').getByRole('button', { name: '删除', exact: true })
    ).toHaveCount(0)
    await expect(page.locator('#source-8')).toContainText('未命名数据源')
    await expect(
      page.locator('#source-8').getByRole('link', { name: '查看当前采集任务' })
    ).toBeVisible()
    await expectContained('.sources-view, .source-card')
    await page.screenshot({ animations: 'disabled', path: `${evidence}/i3-sources-1280.png` })
    await page.setViewportSize({ width: 375, height: 900 })
    await page.emulateMedia({ colorScheme: 'dark' })
    await expectContained('.sources-view, .source-card')
    await page.screenshot({ animations: 'disabled', path: `${evidence}/i3-sources-375.png` })
    await rejectRead('sources', backToList, page.locator('.sources-view'), '无法加载数据源')
    const previous = sources
    sources = []
    await backToList()
    await expect(page.getByText('还没有数据源。创建后即可开始采集。')).toBeVisible()
    sources = previous
    await backToList()
    await expect(page.locator('.source-card')).toHaveCount(3)

    await rejectRead(
      'sources:7',
      () => sourceLink().press('Enter'),
      page.locator('.source-view'),
      '无法读取此数据源'
    )
    await expect(editor).toContainText('完整配置不会在列表重复陈列')
    await expect(save).toBeDisabled()
    await expectContained('.source-view, .source-view__details, .source-view__activity')
    await editor.fill('{')
    await expect(save).toBeDisabled()
    await editor.fill('{"limit":0}')
    await expect(save).toBeDisabled()
    await detail.getByRole('textbox', { name: '昵称', exact: true }).fill('已保存的来源名称')
    const draft = '{\n  "limit": 30,\n  "note": "失败与窄屏变化都保留这份草稿"\n}'
    await editor.fill(draft)
    await expect(save).toBeEnabled()
    await expect(page.getByRole('heading', { name: source.nickname, exact: true })).toBeVisible()
    const rejectedSave = intercept('sources:7', 'POST', 503)
    await save.click()
    await rejectedSave.started
    await expect(save).toBeDisabled()
    await expect(editor).toHaveAttribute('contenteditable', 'false')
    await page.locator('.source-view__back').click()
    await expect(page).toHaveURL(/\/sources\/7$/)
    await page.setViewportSize({ width: 1280, height: 1000 })
    rejectedSave.resume()
    await expect(detail.getByRole('alert')).toContainText('保存失败')
    expect(
      await detail.getByRole('alert').evaluate((element) => {
        const probe = document.createElement('span')
        probe.style.color = 'var(--sys-color-feedback-error)'
        element.append(probe)
        const colors = [getComputedStyle(element).color, getComputedStyle(probe).color]
        probe.remove()
        return colors
      })
    ).toEqual(
      await detail.getByRole('alert').evaluate((element) => {
        const color = getComputedStyle(element).color
        return [color, color]
      })
    )
    await expect(editor).toHaveText(draft, { useInnerText: true })
    await page.setViewportSize({ width: 375, height: 900 })
    await expectContained('.source-view, .source-view__details')
    await editor.press('Escape')
    await expect(page.locator('.cm-tooltip-autocomplete')).toHaveCount(0)
    await detail.getByRole('textbox', { name: '昵称', exact: true }).focus()
    await page.screenshot({
      animations: 'disabled',
      path: `${evidence}/i3-source-save-failed-375.png`,
    })
    await save.click()
    await expect(page.getByRole('heading', { name: '已保存的来源名称', exact: true })).toBeVisible()
    await expect(detail.getByRole('status')).toHaveText('修改已保存。')
    await expect(save).toBeDisabled()
    expect(
      writes.filter((item) => item.key === 'sources:7' && item.method === 'POST')
    ).toHaveLength(2)
    expect(sources.find((item) => item.id === 7).config).toEqual(JSON.parse(draft))
    await editor.fill('{"limit":40,"unsaved":true}')
    page.once('dialog', (dialog) => dialog.dismiss())
    await page.locator('.source-view__back').click()
    await expect(editor).toContainText('unsaved')
    page.once('dialog', (dialog) => dialog.accept())
    await page.locator('.source-view__back').click()
    await expect(page).toHaveURL(/\/sources(?:#source-\d+)?$/)
    await expect(sourceLink()).toHaveText('已保存的来源名称')
    await expect(sourceLink()).toBeFocused()

    // Schema/secondary-region failures remain visible without erasing the editor.
    const typesFailure = intercept('sources_types', 'GET', 403)
    await sourceLink().click()
    await typesFailure.started
    typesFailure.resume()
    await expect(detail.getByRole('alert')).toContainText('无法读取数据源类型')
    await editor.fill('{"limit":31,"kept":true}')
    await expect(save).toBeDisabled()
    await detail.getByRole('button', { name: '重试', exact: true }).click()
    await expect(save).toBeEnabled()
    await expect(editor).toContainText('kept')
    await save.click()
    await expect(detail.getByRole('status')).toHaveText('修改已保存。')
    await expect(save).toBeDisabled()
    await page.locator('.source-view__back').click()
    await expect(sourceLink()).toBeVisible()
    await expect(page.locator('.source-card__operations [role="status"]')).toHaveCount(0)
    const jobsFailure = intercept('jobs:source:7', 'GET', 403)
    await sourceLink().click()
    await jobsFailure.started
    jobsFailure.resume()
    const jobsRegion = page.locator('.source-view__jobs')
    await expect(jobsRegion.getByRole('alert')).toContainText('无法读取采集任务')
    await editor.fill('{"limit":32,"keptDuringRetry":true}')
    await jobsRegion.getByRole('button', { name: '重试', exact: true }).click()
    await expect(jobsRegion.getByRole('alert')).toHaveCount(0)
    await expect(editor).toContainText('keptDuringRetry')
    await save.click()
    await expect(detail.getByRole('status')).toHaveText('修改已保存。')
    await expect(save).toBeDisabled()
    await page.locator('.source-view__back').click()
    await rejectRead(
      'crons:source:7',
      () => sourceLink().click(),
      page.locator('.source-view__schedules'),
      '无法读取定时采集计划'
    )

    // A route parameter change must win over an earlier outstanding read.
    await page.locator('.source-view__back').click()
    const lateSource = intercept('sources:7', 'GET')
    await sourceLink().click()
    await lateSource.started
    await navigate('/sources/8')
    await expect(page.getByRole('heading', { name: '未命名数据源', exact: true })).toBeVisible()
    lateSource.resume()
    await expect(page.locator('.source-view__metadata')).toContainText('#8')
    await navigate('/sources/7')
    await expect(page.getByRole('heading', { name: '已保存的来源名称', exact: true })).toBeVisible()

    // Unsaved type changes must not change the saved source's collection contract.
    const typePicker = detail.getByRole('combobox', { name: '类型', exact: true })
    await typePicker.click()
    await page.getByRole('option', { name: 'fixture.alternative.Source', exact: true }).click()
    await jobsRegion.getByRole('button', { name: '新建任务', exact: true }).click()
    const unsavedTypeJob = page.getByRole('dialog', { name: '创建新采集任务', exact: true })
    await expect(
      unsavedTypeJob.getByRole('button', { name: '创建任务', exact: true })
    ).toBeDisabled()
    await unsavedTypeJob.getByRole('combobox', { name: '采集方式', exact: true }).click()
    await expect(unsavedTypeJob.getByRole('option')).toHaveCount(1)
    await unsavedTypeJob.getByRole('option').click()
    await unsavedTypeJob.getByRole('button', { name: '取消', exact: true }).click()
    await typePicker.click()
    await page.getByRole('option', { name: source.type, exact: true }).click()
    // Job creation uses the loaded type's schema; unsupported backfill is absent.
    await jobsRegion.getByRole('button', { name: '新建任务', exact: true }).click()
    const jobDialog = page.getByRole('dialog', { name: '创建新采集任务', exact: true })
    const createJob = jobDialog.getByRole('button', { name: '创建任务', exact: true })
    await expect(createJob).toBeDisabled()
    await jobDialog.getByRole('combobox', { name: '采集方式', exact: true }).click()
    await expect(jobDialog.getByRole('option')).toHaveCount(1)
    await jobDialog.getByRole('option').click()
    await jobDialog.locator('.cm-content').fill('{"batchSize":3}')
    await expect(createJob).toBeEnabled()
    const jobFailure = intercept('jobs', 'POST', 503)
    await createJob.click()
    await jobFailure.started
    await page.keyboard.press('Escape')
    await expect(jobDialog).toBeVisible()
    await expect(createJob).toBeDisabled()
    jobFailure.resume()
    await expect(jobDialog.getByRole('alert')).toContainText('先查看任务列表')
    await expect(jobDialog.locator('.cm-content')).toContainText('"batchSize":3')
    await createJob.click()
    await expect(page).toHaveURL(/\/jobs\/20$/)
    expect(jobs[0].parameters).toEqual({ source: 7, config: { batchSize: 3 } })
    await navigate('/sources/7')
    await expect(editor).toBeVisible()

    // Existing schedules stay visible; only the creation fields are deferred.
    const schedules = page.locator('.source-view__schedules')
    await schedules.getByRole('button', { name: '添加定时采集', exact: true }).click()
    const cronDialog = page.getByRole('dialog', { name: '添加定时采集', exact: true })
    await cronDialog.getByRole('textbox').fill('30 7 * * *')
    const cronFailure = intercept('crons', 'POST', 503)
    await cronDialog.getByRole('button', { name: '添加定时采集', exact: true }).click()
    await cronFailure.started
    await page.keyboard.press('Escape')
    await expect(cronDialog).toBeVisible()
    cronFailure.resume()
    await expect(cronDialog.getByRole('alert')).toContainText('先检查计划列表')
    await expect(cronDialog.getByRole('textbox')).toHaveValue('30 7 * * *')
    await cronDialog.getByRole('button', { name: '添加定时采集', exact: true }).click()
    await expect(cronDialog).not.toBeVisible()
    await expect(schedules).toContainText('30 7 * * *')
    await schedules.getByRole('button', { name: '删除', exact: true }).click()
    const cronDelete = page.getByRole('dialog', { name: '删除定时采集', exact: true })
    const deleteCronFailure = intercept('crons:21', 'DELETE', 403)
    await cronDelete.getByRole('button', { name: '删除', exact: true }).click()
    await deleteCronFailure.started
    await page.keyboard.press('Escape')
    await expect(cronDelete).toBeVisible()
    deleteCronFailure.resume()
    await expect(cronDelete.getByRole('alert')).toContainText('删除未完成')
    await cronDelete.getByRole('button', { name: '删除', exact: true }).click()
    await expect(cronDelete).not.toBeVisible()
    await expect(schedules).toContainText('尚未设置定时采集')
    await page.setViewportSize({ width: 1280, height: 1000 })
    await page.emulateMedia({ colorScheme: 'light' })
    await expectContained('.source-view, .source-view__details, .source-view__activity')
    await page.screenshot({ animations: 'disabled', path: `${evidence}/i3-source-1280.png` })

    await page.locator('.source-view__back').click()
    await page.getByRole('button', { name: '创建数据源', exact: true }).click()
    const createDialog = page.getByRole('dialog', { name: '创建数据源', exact: true })
    await createDialog.getByRole('textbox', { name: '昵称', exact: true }).fill('新建来源的草稿')
    await createDialog.getByRole('combobox', { name: '类型', exact: true }).click()
    await createDialog.getByRole('option', { name: source.type, exact: true }).click()
    await createDialog.locator('.cm-content').fill('{"limit":15}')
    await page.setViewportSize({ width: 375, height: 900 })
    await expectContained('.create-source, dialog[open]')
    page.once('dialog', (dialog) => dialog.dismiss())
    await page.keyboard.press('Escape')
    await expect(createDialog).toBeVisible()
    await expect(createDialog.locator('.cm-content')).toContainText('"limit":15')
    const createFailure = intercept('sources', 'POST', 503)
    await createDialog.getByRole('button', { name: '创建数据源', exact: true }).click()
    await createFailure.started
    await page.keyboard.press('Escape')
    await expect(createDialog).toBeVisible()
    createFailure.resume()
    await expect(createDialog.getByRole('alert')).toContainText('先检查来源列表')
    await expect(
      createDialog.getByRole('button', { name: '创建数据源', exact: true })
    ).toBeEnabled()
    await expect(createDialog).toHaveCSS('width', /.+px/)
    expect(
      await createDialog.evaluate((element) => element.getBoundingClientRect().width)
    ).toBeGreaterThan(300)
    await page.screenshot({ animations: 'disabled', path: `${evidence}/i3-source-create-375.png` })
    await createDialog.getByRole('button', { name: '创建数据源', exact: true }).click()
    await expect(createDialog).not.toBeVisible()
    await expect(page.locator('#source-22')).toContainText('新建来源的草稿')
    await page.locator('#source-22 .source-card__name').click()
    await detail.getByRole('button', { name: '删除', exact: true }).click()
    const sourceDelete = page.getByRole('dialog', { name: '删除数据源', exact: true })
    await expect(sourceDelete).toContainText('新建来源的草稿 · #22')
    const deleteFailure = intercept('sources:22', 'DELETE', 403)
    await sourceDelete.getByRole('button', { name: '删除', exact: true }).click()
    await deleteFailure.started
    await page.keyboard.press('Escape')
    await expect(sourceDelete).toBeVisible()
    deleteFailure.resume()
    await expect(sourceDelete.getByRole('alert')).toContainText('删除未完成')
    await expect(page).toHaveURL(/\/sources\/22$/)
    await expectContained('dialog[open]')
    await page.screenshot({
      animations: 'disabled',
      path: `${evidence}/i3-source-delete-failed-375.png`,
    })
    await sourceDelete.getByRole('button', { name: '删除', exact: true }).click()
    await expect(page).toHaveURL(/\/sources(?:#source-\d+)?$/)
    await expect(page.locator('#source-22')).toHaveCount(0)
    expect(sources).toHaveLength(3)
    await expect(page.locator('.source-card__operations [role="status"]')).toHaveCount(0)
    const run = page.locator('#source-9').getByRole('button', { name: '立即采集', exact: true })
    const rejectedRun = intercept('jobs', 'POST', 503)
    await run.click()
    await rejectedRun.started
    await expect(run).toBeDisabled()
    rejectedRun.resume()
    await expect(page.locator('#source-9').getByRole('alert')).toContainText('先查看任务列表')
    await run.click()
    await expect(page).toHaveURL(/\/jobs\/23$/)
    expect(jobs[0].parameters).toEqual({ source: 9, config: {} })
    const rowFailure = intercept('jobs:source:8', 'GET', 403)
    await navigate('/sources')
    await rowFailure.started
    rowFailure.resume()
    const failedRow = page.locator('.source-card').filter({ has: page.getByRole('alert') })
    await expect(failedRow).toHaveCount(1)
    await failedRow.getByRole('button', { name: '重试', exact: true }).click()
    await expect(page.locator('.source-card').getByRole('alert')).toHaveCount(0)
    await writeFile(
      `${evidence}/i3-verification.json`,
      JSON.stringify(
        {
          status: 'passed',
          viewports: [1280, 375],
          themes: ['light', 'dark'],
          sources: sources.map(({ id, nickname, config }) => ({ id, nickname, config })),
          writes,
        },
        null,
        2
      ) + '\n'
    )
    console.log(
      'I3 Sources: list/detail/create, independent read errors, schemas, drafts, pending, failed writes, route changes and deletion passed'
    )
  } finally {
    fault?.received()
    await page.unroute(pattern, handler)
  }
}
