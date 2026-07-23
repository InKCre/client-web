import { tool } from 'ai'
import { sendMessage } from 'webext-bridge/popup'
import { z } from 'zod'
import { Block } from '~/logic/info-base/block'

export const infoBaseVectorSearch = tool({
  description:
    'Retrieves semantically relevant knowledge base entries using vector similarity search.',
  inputSchema: z.object({
    query: z.string(),
    distance_threshold: z.number().default(0.8),
  }),
  execute: (parameters) =>
    Block.vectorSearch({
      query: parameters.query,
      distanceThreshold: parameters.distance_threshold,
    }),
})

export const getPageContent = tool({
  description: 'Get the content of the given tab',
  inputSchema: z.object({
    tabId: z.number().min(1).optional(),
  }),
  execute: async (parameters) => {
    return sendMessage('get-page-content', {}, `content-script@${parameters.tabId}`).then(
      (response) => response as string
    )
  },
})
