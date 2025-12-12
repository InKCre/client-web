<script setup lang="ts">
import { computed, ref } from "vue";
import { CollectAt } from "@/business/info-base/source";
import { collectAtFormProps, collectAtFormEmits } from "./collectAtForm";
import InkDropdown from "@/components/common/InkDropdown/InkDropdown.vue";

const props = defineProps(collectAtFormProps);
const emit = defineEmits(collectAtFormEmits);

// --- computed ---
const dayOfWeekModel = computed({
  get: () => props.modelValue?.day_of_week ?? -1,
  set: (value: number) => {
    if (props.modelValue) {
      props.modelValue.day_of_week = value === -1 ? null : value;
    }
  },
});

const hourModel = computed({
  get: () => props.modelValue?.hour ?? -1,
  set: (value: number) => {
    if (props.modelValue) {
      props.modelValue.hour = value === -1 ? null : value;
    }
  },
});

const minuteModel = computed({
  get: () => props.modelValue?.minute ?? 0,
  set: (value: number) => {
    if (props.modelValue) {
      props.modelValue.minute = value;
    }
  },
});
</script>

<template>
  <div class="collect-at-form">
    <template v-if="modelValue">
      <InkDropdown
        v-model="dayOfWeekModel"
        :options="CollectAt.DayOfWeekOptions"
      />
      <InkDropdown v-model="hourModel" :options="CollectAt.HourOptions" />
      <InkDropdown v-model="minuteModel" :options="CollectAt.MinuteOptions" />
    </template>
  </div>
</template>

<style lang="scss" scoped src="./collectAtForm.scss" />
