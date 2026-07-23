import { ref } from 'vue'
import type { Node, Edge } from '@vue-flow/core'
import { type GridLayoutConfig, type LayoutResult, DEFAULT_GRID_CONFIG } from '@inkcre/core'

export interface UseGridLayoutOptions {
  config?: Partial<GridLayoutConfig>
}

export function useGridLayout(options: UseGridLayoutOptions = {}) {
  const isRunning = ref(false)

  const mergedConfig = {
    ...DEFAULT_GRID_CONFIG,
    ...options.config,
  }

  async function apply(nodes: Node[], _edges: Edge[]): Promise<LayoutResult> {
    isRunning.value = true

    try {
      const positions = new Map<string, { x: number; y: number }>()
      const n = nodes.length

      if (n === 0) {
        return {
          positions,
          bounds: { width: 0, height: 0 },
        }
      }

      // Calculate columns: use config or auto-calculate based on node count
      const columns = mergedConfig.columns > 0 ? mergedConfig.columns : Math.ceil(Math.sqrt(n))

      const cellWidth = mergedConfig.cellWidth
      const cellHeight = mergedConfig.cellHeight
      const gap = mergedConfig.gap

      nodes.forEach((node, i) => {
        const col = i % columns
        const row = Math.floor(i / columns)

        positions.set(node.id, {
          x: col * (cellWidth + gap),
          y: row * (cellHeight + gap),
        })
      })

      const rows = Math.ceil(n / columns)

      return {
        positions,
        bounds: {
          width: columns * (cellWidth + gap) - gap,
          height: rows * (cellHeight + gap) - gap,
        },
      }
    } finally {
      isRunning.value = false
    }
  }

  function stop() {
    isRunning.value = false
  }

  return {
    isRunning,
    apply,
    stop,
  }
}
