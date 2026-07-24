import { type PropType } from 'vue'
import { Client } from '@inkcre/core'

export const clientCardProps = {
  client: { type: Object as PropType<Client>, required: true },
  status: {
    type: String as PropType<'online' | 'offline' | 'unknown'>,
    required: true,
  },
} as const

export const clientCardEmits = {
  updated: () => true,
} as const
