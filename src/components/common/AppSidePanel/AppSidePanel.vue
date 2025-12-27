<script setup lang="ts">
import { ref, watch } from "vue";
import { useRoute } from "vue-router";
import router from "@/router";
import { appSidePanelProps, appSidePanelEmits } from "./AppSidePanel";
import { InkButton } from "@inkcre/web-design";

const props = defineProps(appSidePanelProps);
const emit = defineEmits(appSidePanelEmits);
const route = useRoute();

// --- methods ---
const onSourcesClick = () => {
  router.push("/sources");
};

const onExtensionsClick = () => {
  router.push("/extensions");
};

const onSettingsClick = () => {
  // Placeholder for settings navigation
  console.log("Navigate to Settings");
};

const onExploreClick = () => {
  router.push("/info-base/graph");
};

watch(
  () => route.name,
  (newRouteName) => {
    // Expand sidebar on start view, collapse on others
    if (newRouteName === "InKCre") {
      emit("update:expanded", true);
    } else {
      emit("update:expanded", false);
    }
  }
);
</script>

<template>
  <aside class="app-side-panel" v-show="props.expanded">
    <div class="app-side-panel__content">
      <h2 class="app-side-panel__title">Managing</h2>
      <InkButton text="Sources" class="w-full" @click="onSourcesClick" />
      <InkButton text="Extensions" class="w-full" @click="onExtensionsClick" />
      <InkButton text="Settings" class="w-full" @click="onSettingsClick" />
    </div>
    <InkButton text="Explore" class="w-full" @click="onExploreClick" />
  </aside>
</template>

<style lang="scss" scoped src="./AppSidePanel.scss"></style>
