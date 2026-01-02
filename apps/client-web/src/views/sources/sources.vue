<script setup lang="ts">
import { onMounted } from "vue";
import { useAsyncState } from "@vueuse/core";
import sourceCard from "@/components/source/sourceCard/sourceCard.vue";
import CreateSource from "@/components/source/createSource/createSource.vue";
import { InkLoading } from "@inkcre/web-design";
import { Source } from "@/business/source";

// Use useAsyncState for sources with refetch capability
const {
  state: sources,
  execute: refetchSources,
  isLoading: sourcesLoading,
} = useAsyncState(() => Source.getAll(), []);

// --- lifecycle ---
onMounted(() => {
  refetchSources();
});

// --- methods ---
const onCreateSource = () => {
  refetchSources();
};

const onDeleteSource = (source: Source) => {
  source.delete().then(() => {
    // Refetch after delete
    refetchSources();
  });
};

const onEditConfig = (source: Source) => {
  source.save().then(() => {
    // Refetch after edit
    refetchSources();
  });
};
</script>

<template>
  <main class="sources-view">
    <CreateSource @create="onCreateSource" />

    <div class="sources-view__list">
      <InkLoading v-if="sourcesLoading" />
      <sourceCard
        v-for="source in sources"
        :key="source.id"
        :source="source"
        @delete="onDeleteSource"
        @edit-config="onEditConfig"
      />
    </div>
  </main>
</template>

<style lang="scss" scoped src="./sources.scss" />
