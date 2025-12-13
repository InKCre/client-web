<script setup lang="ts">
import { computed, reactive } from "vue";
import { InkInput, InkJsonEditor, InkField, InkButton, InkForm, InkSwitch, InkDropdown } from "@inkcre/web-design";
import collectAtForm from "../collectAtForm/collectAtForm.vue";
import { createSourceEmits } from "./createSource";
import { CollectAt, SourceForm, SourceType } from "@/business/info-base/source";
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

// --- computed ---
const configJson = computed({
  get: () => JSON.stringify(form.value.config),
  set: (value: string) => {
    try {
      form.value.config = JSON.parse(value);
    } catch {
      // Invalid JSON, keep the raw value
    }
  },
});

const toggleAutoCollect = computed({
  get: () => form.value.collect_at != null,
  set: (value: boolean) => {
    if (value) {
      if (form.value.collect_at == null) {
        form.value.collect_at = CollectAt.parse({});
      }
    } else {
      form.value.collect_at = null;
    }
  },
});

const loadSourceTypes = async () => {
  const sourceTypes = await SourceType.getAll();
  return sourceTypes.map((type) => ({
    label: type.id,
    value: type.id,
    description: type.description,
  }));
};

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

    <InkForm class="form">
      <InkInput v-model="form.nickname" label="Nickname" editable />

      <InkDropdown
        v-model="form.type"
        :options="loadSourceTypes"
        label="Type"
        show-refresh
      />

      <InkField label="Collect At" prop="collect_at">
        <template #label-right>
          <div class="flex flex-row flex-1 justify-end">
            <InkSwitch v-model="toggleAutoCollect" size="xs" />
          </div>
        </template>
        <collectAtForm
          v-if="form.collect_at"
          v-model="form.collect_at"
          class="form__collect-at"
        />
        <span v-else class="form__collect-at-placeholder"
          >Auto collect off.</span
        >
      </InkField>

      <InkJsonEditor
        v-model="configJson"
        label="Config"
        placeholder="{}"
        :rows="6"
      />
    </InkForm>

    <div class="footer">
      <InkButton text="Create" type="primary" size="md" @click="onCreate" />
    </div>
  </div>
</template>

<style lang="scss" scoped src="./createSource.scss" />
