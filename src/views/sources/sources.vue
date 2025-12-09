<script setup lang="ts">
import { ref, onMounted } from "vue";
import sourceCard from "@/components/info-base/source/sourceCard/sourceCard.vue";
import CreateSource from "@/components/info-base/source/createSource/createSource.vue";
import { SourceForm, Source } from "@/business/info-base/source";

// Placeholder data for source list
const sources = ref<Source[]>([]);

// --- lifecycle ---
onMounted(() => {
  Source.getAll().then((data) => {
    sources.value = data;
  });
});

// --- methods ---
const onCreateSource = (data: SourceForm) => {
  // Placeholder: Create new source
  console.log("Create source:", data);
  // TODO: Implement actual source creation logic
};

const onEditSource = (id: number) => {
  // Placeholder: Edit source
  console.log("Edit source:", id);
  // TODO: Implement actual edit logic
};

const onDeleteSource = (id: number) => {
  // Placeholder: Delete source
  console.log("Delete source:", id);
  // TODO: Implement actual delete logic
  sources.value = sources.value.filter((s) => s.id !== id);
};

const onRunSource = (id: number) => {
  // Placeholder: Run source now
  console.log("Run source now:", id);
  // TODO: Implement actual run logic
};

const onEditConfig = (id: number) => {
  // Placeholder: Edit source config
  console.log("Edit config:", id);
  // TODO: Implement actual config edit logic
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
        @edit="onEditSource"
        @delete="onDeleteSource"
        @run="onRunSource"
        @edit-config="onEditConfig"
      />
    </div>
  </main>
</template>

<style lang="scss" scoped src="./sources.scss" />
