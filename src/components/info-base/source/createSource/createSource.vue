<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import {
  InkInput,
  InkJsonEditor,
  InkField,
  InkButton,
  InkForm,
  InkSwitch,
  InkDropdown,
  type DropdownOption,
} from "@inkcre/web-design";
import collectAtForm from "../collectAtForm/collectAtForm.vue";
import { createSourceEmits } from "./createSource";
import { CollectAt, SourceForm, SourceType } from "@/business/info-base/source";
import { refManualReset } from "@vueuse/core";

const emit = defineEmits(createSourceEmits);
const configJson = ref<string>("");

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
const sourceTypes = ref<(DropdownOption & SourceType)[]>([]);

// --- computed ---
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

const currentSourceType = computed(() => {
  return sourceTypes.value.find((type) => type.value === form.value.type);
});

// --- methods ---
const loadSourceTypes = async (): Promise<(DropdownOption & SourceType)[]> => {
  const result = await SourceType.getAll();
  return result.map((type) => ({
    label: type.id,
    value: type.id,
    ...type,
  }));
};

const onCreate = () => {
  form.value.config = JSON.parse(configJson.value);
  form.value.create().then(() => {
    emit("create", form.value);
    // Reset form on success
    form.reset();
  });
};

// -- watchers ---
watch(
  () => form.value.config,
  (newVal) => {
    configJson.value = JSON.stringify(newVal, null, 2);
  },
  { immediate: true }
);
</script>

<template>
  <div class="create-source">
    <h2 class="title">Create Source</h2>

    <InkForm class="form">
      <InkInput v-model="form.nickname" label="Nickname" editable />

      <InkDropdown
        v-model="form.type"
        v-model:options="sourceTypes"
        :refresher="loadSourceTypes"
        label="Type"
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
        :schema="currentSourceType?.config_schema"
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
