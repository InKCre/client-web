<script setup lang="ts">
import { InkButton } from "@inkcre/web-design";
import { newCollectJobProps, newCollectJobEmits } from "./newCollectJob";
import {
  SourceCollectJobForm,
  SourceCollectJobStatus,
} from "@/business/info-base/source";

const props = defineProps(newCollectJobProps);
const emit = defineEmits(newCollectJobEmits);

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
      Create a new collect job for this source. The job will be queued and
      executed as soon as possible.
    </p>
    <InkButton
      text="Create Job"
      type="primary"
      size="md"
      class="w-full"
      @click="onCreate"
    />
  </div>
</template>

<style lang="scss" scoped src="./newCollectJob.scss" />
