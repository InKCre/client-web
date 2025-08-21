<template>
  <div class="graph-explorer">
    <v-stage :config="stageConfig">
      <v-layer>
        <!-- 关系线 -->
        <template v-for="relation in relations" :key="relation.id">
          <v-arrow
            :points="getRelationPoints(relation)"
            :pointerLength="10"
            :pointerWidth="10"
            :fill="'#888'"
            :stroke="'#888'"
            :strokeWidth="2"
          />
          <v-text
            v-if="getRelationLabelPosition(relation)"
            :x="getRelationLabelPosition(relation).x"
            :y="getRelationLabelPosition(relation).y"
            :text="relation.content"
            :rotation="getRelationLabelPosition(relation).angle"
            fontSize="14"
            fill="#444"
            align="center"
            verticalAlign="middle"
            :width="80"
            :height="24"
            offsetX="40"
            offsetY="12"
            listening="false"
          />
        </template>
        <!-- 块节点 -->
        <v-group
          v-for="block in blocks"
          :key="block.id"
          :x="block.x"
          :y="block.y"
          draggable
          @dragmove="onDragMove(block, $event)"
        >
          <v-rect
            :width="blockWidth"
            :height="blockHeight"
            :fill="'#fff'"
            :stroke="'#1976d2'"
            :strokeWidth="2"
            :cornerRadius="8"
            shadowBlur="6"
          />
          <v-text
            :text="block.content"
            :width="blockWidth"
            :height="blockHeight"
            align="center"
            verticalAlign="middle"
            fontSize="16"
            fill="#1976d2"
          />
        </v-group>
      </v-layer>
    </v-stage>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { StageConfig } from 'konva/lib/Stage'

// 测试数据：块
interface Block {
  id: number
  content: string
  x: number
  y: number
}

// 测试数据：关系
interface Relation {
  id: number
  from_: number
  to_: number
  content: string
}

const blockWidth = 120
const blockHeight = 60

const blocks = ref<Block[]>([
  { id: 1, content: '块A', x: 100, y: 100 },
  { id: 2, content: '块B', x: 400, y: 120 },
  { id: 3, content: '块C', x: 250, y: 300 },
])

const relations = ref<Relation[]>([
  { id: 1, from_: 1, to_: 2, content: '因果' },
  { id: 2, from_: 2, to_: 3, content: 'attachment' },
  { id: 3, from_: 1, to_: 3, content: '' },
])

const stageConfig: StageConfig = {
  width: 700,
  height: 500,
  draggable: false,
  style: 'background: #f5f7fa; border-radius: 8px; box-shadow: 0 2px 8px #0001;',
}

function getBlockCenter(block: Block) {
  return [block.x + blockWidth / 2, block.y + blockHeight / 2]
}

function getRelationPoints(relation: Relation) {
  const from = blocks.value.find((b) => b.id === relation.from_)
  const to = blocks.value.find((b) => b.id === relation.to_)
  if (!from || !to) return []
  return [...getBlockCenter(from), ...getBlockCenter(to)]
}

// 获取关系文本的中点坐标和角度
function getRelationLabelPosition(relation: Relation) {
  const points = getRelationPoints(relation)
  if (points.length !== 4) return null
  const [x1, y1, x2, y2] = points
  // 箭头中点
  const mx = (x1 + x2) / 2
  const my = (y1 + y2) / 2
  // 角度（弧度转角度）
  const angle = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI
  return { x: mx, y: my, angle }
}

function onDragMove(block: Block, evt: any) {
  block.x = evt.target.x()
  block.y = evt.target.y()
}
</script>

<style scoped>
.graph-explorer {
  width: 700px;
  margin: 0 auto;
  background: #f5f7fa;
  border-radius: 8px;
  box-shadow: 0 2px 8px #0001;
  padding: 24px 0;
}
</style>
