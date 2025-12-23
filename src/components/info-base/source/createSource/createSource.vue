<script setup lang="ts">
import { reactive } from "vue";
import { InkButton } from "@inkcre/web-design";
import sourceForm from "../sourceForm/sourceForm.vue";
import { createSourceEmits } from "./createSource";
import { CollectAt, SourceForm } from "@/business/info-base/source";
import { refManualReset } from "@vueuse/core";

const emit = defineEmits(createSourceEmits);

// --- data ---
const form = refManualReset(() =>
  reactive(
    new SourceForm({
      nickname: "",
      type: "",
      config: {},
      collect_at: CollectAt.parse({}),
    })
  )
);

// --- methods ---
const onCreate = () => {
  form.value.create().then(() => {
    emit("create", form.value);
    // Reset form on success
    form.reset();
  });
};
</script>

<template>
  <div class="create-source">
    <h2 class="title">Create Source</h2>

    <sourceForm v-model="form" class="form" />

    <div class="footer">
      <InkButton text="Create" type="primary" size="md" @click="onCreate" />
    </div>
  </div>
</template>

<style lang="scss" scoped src="./createSource.scss" />
