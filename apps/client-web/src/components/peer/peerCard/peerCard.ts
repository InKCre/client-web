import { type PropType } from 'vue'
import { Peer } from '@inkcre/core'

export const peerCardProps = {
  peer: { type: Object as PropType<Peer>, required: true },
  status: {
    type: String as PropType<'online' | 'offline' | 'unknown'>,
    required: true,
  },
} as const

export const peerCardEmits = {
  updated: () => true,
} as const
