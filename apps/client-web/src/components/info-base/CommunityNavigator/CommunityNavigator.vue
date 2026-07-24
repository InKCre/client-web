<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { InkDropdown, type DropdownOption } from '@inkcre/web-design'
import type { CommunityMetadata } from '@inkcre/core'

interface CommunityNavigatorProps {
  communities: CommunityMetadata[]
  currentCommunityId: string
}

interface CommunityNavigatorEmits {
  (e: 'community-select', communityId: string): void
}

const props = defineProps<CommunityNavigatorProps>()
const emit = defineEmits<CommunityNavigatorEmits>()
const { t } = useI18n()

// Dropdown options
const dropdownOptions = computed<DropdownOption[]>(() => [
  {
    label: t('infoBase.graph.community.all'),
    value: 'all',
  },
  ...props.communities.map((comm) => ({
    label: `${comm.label} (${t('infoBase.graph.community.nodeCount', {
      count: comm.nodeCount,
    })})`,
    value: comm.id,
  })),
])

// Selected value (for v-model with dropdown)
const selectedValue = computed({
  get: () => props.currentCommunityId,
  set: (value: string) => {
    emit('community-select', value)
  },
})
</script>

<template>
  <div class="community-navigator">
    <div class="community-navigator__dropdown">
      <InkDropdown v-model="selectedValue" :options="dropdownOptions" :enable-stepping="true" />
    </div>

    <div v-if="props.communities.length === 0" class="community-navigator__no-results">
      {{ t('infoBase.graph.community.noResults') }}
    </div>
  </div>
</template>

<style lang="scss" scoped src="./CommunityNavigator.scss" />
