<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { InkButton } from "@inkcre/web-design";
import { newCollectJobProps, newCollectJobEmits } from "./newCollectJob";
import {
  SourceCollectJobForm,
  SourceCollectJobStatus,
} from "@/business/info-base/source";

const props = defineProps(newCollectJobProps);
const emit = defineEmits(newCollectJobEmits);
const { t } = useI18n();

// --- methods ---
const onCreate = async () => {
  const form = new SourceCollectJobForm({
    source: props.sourceId,
    created_at: new Date(),
    started_at: null,
    closed_at: null,
    status: SourceCollectJobStatus.PENDING,
    state: {},
  });
  const job = await form.create();
  emit("create", job);
};
</script>

<template>
  <div class="new-collect-job">
    <p class="new-collect-job__description">
      {{ t("source.newJobDescription") }}
    </p>
    <InkButton
      :text="t('source.createJob')"
      type="primary"
      size="md"
      class="w-full"
      @click="onCreate"
    />
  </div>
</template>

<style lang="scss" scoped src="./newCollectJob.scss" />
