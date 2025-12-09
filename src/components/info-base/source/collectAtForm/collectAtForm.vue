<script setup lang="ts">
import { computed, ref } from "vue";
import { CollectAt } from "@/business/info-base/source";
import { collectAtFormProps, collectAtFormEmits } from "./collectAtForm";
import InkPicker from "@/components/common/InkPicker/InkPicker.vue";
import InkDropdown from "@/components/common/InkDropdown/InkDropdown.vue";
import InkSwitch from "@/components/common/InkSwitch/InkSwitch.vue";

const props = defineProps(collectAtFormProps);
const emit = defineEmits(collectAtFormEmits);

// --- computed ---
const timeModel = computed({
  get: () => {
    if (!props.modelValue) return new Date();
    const d = new Date();
    d.setHours(props.modelValue.hour ?? 0);
    d.setMinutes(props.modelValue.minute ?? 0);
    return d;
  },
  set: (date: Date) => {
    if (props.modelValue) {
      props.modelValue.hour = date.getHours();
      props.modelValue.minute = date.getMinutes();
    }
  },
});
</script>

<template>
  <div class="collect-at-form">
    <template v-if="modelValue">
      <InkDropdown
        v-model="modelValue.day_of_week"
        :options="CollectAt.DayOfWeekOptions"
      />
      <InkPicker v-model="timeModel" type="time" displayValueAs="box" />
    </template>
  </div>
</template>

<style lang="scss" scoped src="./collectAtForm.scss" />
