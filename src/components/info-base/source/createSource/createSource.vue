<script setup lang="ts">
import { ref, computed, reactive, customRef } from "vue";
import InkInput from "@/components/common/InkInput/InkInput.vue";
import InkJsonEditor from "@/components/common/InkJsonEditor/InkJsonEditor.vue";
import InkField from "@/components/common/InkField/InkField.vue";
import InkButton from "@/components/common/InkButton/InkButton.vue";
import InkForm from "@/components/common/InkForm/InkForm.vue";
import InkDropdown from "@/components/common/InkDropdown/InkDropdown.vue";
import collectAtForm from "../collectAtForm/collectAtForm.vue";
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
      collect_at: new CollectAt({
        hour: 0,
        minute: 0,
        day_of_week: null,
      }),
    })
  )
);
const configJson = ref("{}");

// --- computed ---
const configJsonFormatted = computed({
  get: () => configJson.value,
  set: (value: string) => {
    configJson.value = value;
    try {
      form.value.config = JSON.parse(value);
    } catch {
      // Invalid JSON, keep the raw value
    }
  },
});

// --- methods ---
const onCreate = () => {
  // TODO
  emit("create", form.value);
  // Reset form after emit
  form.reset();
};
</script>

<template>
  <div class="create-source">
    <h2 class="title">Create Source</h2>

    <InkForm class="form">
      <InkInput v-model="form.nickname" label="Nickname" editable />

      <InkDropdown
        v-model="form.type"
        :options="[
          { label: 'Type A', value: 'type_a' },
          { label: 'Type B', value: 'type_b' },
          { label: 'Type C', value: 'type_c' },
        ]"
        label="Type"
      />

      <InkField label="Collect At" prop="collect_at">
        <collectAtForm
          :modelValue="form.collect_at!"
          class="form__collect-at"
        />
      </InkField>

      <InkJsonEditor
        v-model="configJsonFormatted"
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
