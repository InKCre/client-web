<script setup lang="ts">
import { watch } from "vue";
import { useRoute } from "vue-router";
import { useI18n } from "vue-i18n";
import router from "@/router";
import { appSidePanelProps, appSidePanelEmits } from "./AppSidePanel";
import { InkButton } from "@inkcre/web-design";

const props = defineProps(appSidePanelProps);
const emit = defineEmits(appSidePanelEmits);
const route = useRoute();
const { t } = useI18n();

// --- methods ---
const onSourcesClick = () => {
  router.push("/sources");
};

const onExtensionsClick = () => {
  router.push("/extensions");
};

const onSettingsClick = () => {
  router.push("/settings");
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
      <h2 class="app-side-panel__title">{{ t("sidePanel.managing") }}</h2>
      <InkButton
        :text="t('sidePanel.sources')"
        class="w-full"
        @click="onSourcesClick"
      />
      <InkButton
        :text="t('sidePanel.extensions')"
        class="w-full"
        @click="onExtensionsClick"
      />
      <InkButton
        :text="t('sidePanel.settings')"
        class="w-full"
        @click="onSettingsClick"
      />
    </div>

    <div class="app-side-panel__content">
      <h2 class="app-side-panel__title">{{ t("sidePanel.infoBase") }}</h2>
      <InkButton
        :text="t('sidePanel.explore')"
        class="w-full"
        @click="onExploreClick"
      />
    </div>
  </aside>
</template>

<style lang="scss" scoped src="./AppSidePanel.scss"></style>
