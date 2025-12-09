<script setup lang="ts">
import { onMounted } from "vue";
import { useAsyncState } from "@vueuse/core";
import sourceCard from "@/components/info-base/source/sourceCard/sourceCard.vue";
import CreateSource from "@/components/info-base/source/createSource/createSource.vue";
import { Source } from "@/business/info-base/source";

// Use useAsyncState for sources with refetch capability
const { state: sources, execute: refetchSources } = useAsyncState(
  () => Source.getAll(),
  []
);

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

const onRunSource = (source: Source) => {
  // TODO
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
      <sourceCard
        v-for="source in sources"
        :key="source.id"
        :source="source"
        @delete="onDeleteSource"
        @run="onRunSource"
        @edit-config="onEditConfig"
      />
    </div>
  </main>
</template>

<style lang="scss" scoped src="./sources.scss" />
