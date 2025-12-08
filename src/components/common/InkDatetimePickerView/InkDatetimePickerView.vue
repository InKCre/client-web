<script setup lang="ts">
import { computed, ref, watch } from "vue";
import {
  inkDatetimePickerViewProps,
  inkDatetimePickerViewEmits,
  MONTHS,
  getDaysInMonth,
  getYearRange,
  padZero,
  formatHour,
  getAmPm,
} from "./InkDatetimePickerView";

const props = defineProps(inkDatetimePickerViewProps);
const emit = defineEmits(inkDatetimePickerViewEmits);

// --- data ---
const selectedWeekday = ref(props.modelValue.getDay());
const selectedYear = ref(props.modelValue.getFullYear());
const selectedMonth = ref(props.modelValue.getMonth());
const selectedDay = ref(props.modelValue.getDate());
const selectedHour = ref(props.modelValue.getHours());
const selectedMinute = ref(props.modelValue.getMinutes());

// --- computed ---
const showDate = computed(() => {
  return props.mode.includes("date") || props.mode === "datetime";
});

const showTime = computed(() => {
  return props.mode === "time" || props.mode.includes("datetime");
});

const years = computed(() => {
  return getYearRange(props.minDate, props.maxDate);
});

const months = computed(() => {
  return MONTHS.map((month, index) => ({ label: month, value: index }));
});

const days = computed(() => {
  const daysInMonth = getDaysInMonth(selectedYear.value, selectedMonth.value);
  const dayList: number[] = [];
  for (let i = 1; i <= daysInMonth; i++) {
    dayList.push(i);
  }
  return dayList;
});

const hours = computed(() => {
  const hourList: string[] = [];
  const maxHour = props.hourFormat === "12" ? 12 : 23;
  for (let i = 0; i <= maxHour; i++) {
    if (props.hourFormat === "12") {
      hourList.push(i === 0 ? "12" : padZero(i));
    } else {
      hourList.push(padZero(i));
    }
  }
  return hourList;
});

const minutes = computed(() => {
  const minuteList: string[] = [];
  for (let i = 0; i < 60; i++) {
    minuteList.push(padZero(i));
  }
  return minuteList;
});

const amPmOptions = computed(() => ["AM", "PM"]);

const displayHour = computed(() => {
  return formatHour(selectedHour.value, props.hourFormat);
});

const amPm = computed(() => {
  return getAmPm(selectedHour.value);
});

// --- methods ---
const updateModelValue = () => {
  const newDate = new Date(
    selectedYear.value,
    selectedMonth.value,
    selectedDay.value,
    selectedHour.value,
    selectedMinute.value
  );

  const isWithinRange =
    (!props.minDate || newDate >= props.minDate) &&
    (!props.maxDate || newDate <= props.maxDate);

  if (isWithinRange) {
    emit("update:modelValue", newDate);
  }
};

const onYearChange = (year: number) => {
  selectedYear.value = year;
  adjustDayIfNeeded();
  updateModelValue();
};

const onMonthChange = (month: number) => {
  selectedMonth.value = month;
  adjustDayIfNeeded();
  updateModelValue();
};

const onDayChange = (day: number) => {
  selectedDay.value = day;
  updateModelValue();
};

const onHourChange = (hour: string) => {
  let hourValue = parseInt(hour, 10);
  if (props.hourFormat === "12") {
    const isPm = amPm.value === "PM";
    if (hourValue === 12) {
      hourValue = isPm ? 12 : 0;
    } else {
      hourValue = isPm ? hourValue + 12 : hourValue;
    }
  }
  selectedHour.value = hourValue;
  updateModelValue();
};

const onMinuteChange = (minute: string) => {
  selectedMinute.value = parseInt(minute, 10);
  updateModelValue();
};

const onAmPmChange = (period: string) => {
  if (props.hourFormat === "12") {
    const isPm = period === "PM";
    const currentHour12 = selectedHour.value % 12 || 12;
    selectedHour.value = isPm
      ? currentHour12 === 12
        ? 12
        : currentHour12 + 12
      : currentHour12 === 12
      ? 0
      : currentHour12;
    updateModelValue();
  }
};

const adjustDayIfNeeded = () => {
  const maxDays = getDaysInMonth(selectedYear.value, selectedMonth.value);
  if (selectedDay.value > maxDays) {
    selectedDay.value = maxDays;
  }
};

// --- watchers ---
watch(
  () => props.modelValue,
  (newValue) => {
    selectedWeekday.value = newValue.getDay();
    selectedYear.value = newValue.getFullYear();
    selectedMonth.value = newValue.getMonth();
    selectedDay.value = newValue.getDate();
    selectedHour.value = newValue.getHours();
    selectedMinute.value = newValue.getMinutes();
  }
);
</script>

<template>
  <div class="ink-datetime-picker-view">
    <div class="ink-datetime-picker-view__columns">
      <div v-if="showDate" class="ink-datetime-picker-view__column">
        <div class="ink-datetime-picker-view__label">Year</div>
        <div class="ink-datetime-picker-view__options">
          <div
            v-for="year in years"
            :key="year"
            :class="[
              'ink-datetime-picker-view__option',
              {
                'ink-datetime-picker-view__option--selected':
                  year === selectedYear,
              },
            ]"
            @click="onYearChange(year)"
          >
            {{ year }}
          </div>
        </div>
      </div>

      <div v-if="showDate" class="ink-datetime-picker-view__column">
        <div class="ink-datetime-picker-view__label">Month</div>
        <div class="ink-datetime-picker-view__options">
          <div
            v-for="month in months"
            :key="month.value"
            :class="[
              'ink-datetime-picker-view__option',
              {
                'ink-datetime-picker-view__option--selected':
                  month.value === selectedMonth,
              },
            ]"
            @click="onMonthChange(month.value)"
          >
            {{ month.label }}
          </div>
        </div>
      </div>

      <div v-if="showDate" class="ink-datetime-picker-view__column">
        <div class="ink-datetime-picker-view__label">Day</div>
        <div class="ink-datetime-picker-view__options">
          <div
            v-for="day in days"
            :key="day"
            :class="[
              'ink-datetime-picker-view__option',
              {
                'ink-datetime-picker-view__option--selected':
                  day === selectedDay,
              },
            ]"
            @click="onDayChange(day)"
          >
            {{ day }}
          </div>
        </div>
      </div>

      <div v-if="showTime" class="ink-datetime-picker-view__column">
        <div class="ink-datetime-picker-view__label">Hour</div>
        <div class="ink-datetime-picker-view__options">
          <div
            v-for="hour in hours"
            :key="hour"
            :class="[
              'ink-datetime-picker-view__option',
              {
                'ink-datetime-picker-view__option--selected':
                  hour === displayHour,
              },
            ]"
            @click="onHourChange(hour)"
          >
            {{ hour }}
          </div>
        </div>
      </div>

      <div v-if="showTime" class="ink-datetime-picker-view__column">
        <div class="ink-datetime-picker-view__label">Minute</div>
        <div class="ink-datetime-picker-view__options">
          <div
            v-for="minute in minutes"
            :key="minute"
            :class="[
              'ink-datetime-picker-view__option',
              {
                'ink-datetime-picker-view__option--selected':
                  minute === padZero(selectedMinute),
              },
            ]"
            @click="onMinuteChange(minute)"
          >
            {{ minute }}
          </div>
        </div>
      </div>

      <div
        v-if="showTime && hourFormat === '12'"
        class="ink-datetime-picker-view__column"
      >
        <div class="ink-datetime-picker-view__label">Period</div>
        <div class="ink-datetime-picker-view__options">
          <div
            v-for="period in amPmOptions"
            :key="period"
            :class="[
              'ink-datetime-picker-view__option',
              { 'ink-datetime-picker-view__option--selected': period === amPm },
            ]"
            @click="onAmPmChange(period)"
          >
            {{ period }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped src="./InkDatetimePickerView.scss" />
