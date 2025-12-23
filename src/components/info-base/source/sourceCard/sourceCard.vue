<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import {
  InkField,
  InkButton,
  InkInput,
  InkPicker,
  InkPopup,
  InkSwitch,
  InkJsonEditor,
  InkDoubleCheck,
} from "@inkcre/web-design";
import collectAtForm from "@/components/info-base/source/collectAtForm/collectAtForm.vue";
import { sourceCardEmits, type SourceCardProps } from "./sourceCard";
import {
  CollectAt,
  Source,
  SourceCollectJob,
  SourceCollectJobForm,
  SourceCollectJobStatus,
  SourceType,
} from "@/business/info-base/source";
import { useCloned, computedAsync } from "@vueuse/core";

const props = defineProps<SourceCardProps>();
const emit = defineEmits(sourceCardEmits);
const { t } = useI18n();
const router = useRouter();

// --- data ---
const sourceData = computedAsync(
  async (): Promise<Source> => {
    if (props.source) {
      return props.source;
    } else if (props.sourceId) {
      return await Source.get(props.sourceId);
    }
    throw new Error("Either 'source' or 'sourceId' must be provided");
  },
  undefined,
  { shallow: false }
);
const sourceType = computedAsync(
  async (): Promise<SourceType | undefined> => {
    if (sourceData.value?.type) {
      return await SourceType.get(sourceData.value.type);
    }
    return undefined;
  },
  undefined,
  { shallow: false }
);
const latestRunningJob = computedAsync(
  async (): Promise<SourceCollectJob | null> => {
    if (sourceData.value?.id) {
      return await SourceCollectJob.getLatestRunningBySource(
        sourceData.value.id
      );
    }
    return null;
  },
  null,
  { shallow: false }
);
const collectAtModel = ref<CollectAt | null>(null);
const configPopupOpen = ref(false);
const configModel = ref("");
const nicknameModel = ref("");

// --- watchers ---
watch(
  () => sourceData.value?.collect_at,
  (newVal) => {
    collectAtModel.value = newVal ? useCloned(newVal).cloned.value : null;
  },
  { immediate: true }
);

watch(
  () => sourceData.value?.nickname,
  (newVal) => {
    nicknameModel.value = newVal || "";
  },
  { immediate: true }
);

// --- computed ---
const formattedConfig = computed(() => {
  return JSON.stringify(sourceData.value?.config || {}, null, 2);
});

const toggleAutoCollect = computed({
  get: () => collectAtModel.value != null,
  set: (value: boolean) => {
    if (value) {
      if (collectAtModel.value == null) {
        collectAtModel.value = CollectAt.parse({});
      }
    } else {
      collectAtModel.value = null;
    }
  },
});

// --- methods ---
const onNicknameSave = (newNickname: string) => {
  if (sourceData.value) {
    sourceData.value.nickname = newNickname;
    sourceData.value.save();
  }
};

const onEditConfig = () => {
  configModel.value = formattedConfig.value;
  configPopupOpen.value = true;
};

const onRunNow = async () => {
  const form = new SourceCollectJobForm({
    source: sourceData.value!.id,
    created_at: new Date(),
    started_at: null,
    closed_at: null,
    status: SourceCollectJobStatus.PENDING,
    state: {},
  });
  const job = await form.create();
  router.push(`/sources/collectJob/${job.id}`);
};

const onDelete = () => {
  emit("delete", sourceData.value!);
};

const onConfirmCollectAt = () => {
  sourceData.value!.collect_at = useCloned(collectAtModel.value).cloned.value;
  sourceData.value!.save();
};

const onCheckRunningJob = () => {
  if (latestRunningJob.value) {
    router.push(`/sources/collectJob/${latestRunningJob.value.id}`);
  }
};

const onCardClick = () => {
  if (sourceData.value) {
    router.push(`/sources/${sourceData.value.id}`);
  }
};

const onConfirmConfig = () => {
  try {
    const parsedConfig = JSON.parse(configModel.value);
    sourceData.value!.config = parsedConfig;
    sourceData.value!.save();
    configPopupOpen.value = false;
  } catch (error) {
    // Handle JSON parse error, maybe show a toast or something
    console.error("Invalid JSON:", error);
  }
};
</script>

<template>
  <div v-if="sourceData" class="source-card" @click="onCardClick">
    <div class="source-card__metadata">
      <div class="source-card__left">
        <span class="source-card__type">{{ sourceData.type }}</span>
        <InkInput
          :modelValue="nicknameModel"
          type="inline"
          placeholder="Click to edit nickname"
          @click.stop
          @update:modelValue="
            (value: string) => {
              nicknameModel = value;
              onNicknameSave(value);
            }
          "
        >
          <span class="source-card__nickname">{{ nicknameModel }}</span>
        </InkInput>
      </div>
      <div class="source-card__right">
        <span class="source-card__id-label">#</span>
        <span class="source-card__id">{{ sourceData.id }}</span>
      </div>
    </div>

    <InkField
      class="source-card__collect-at"
      label="Will run collect at"
      layout="inline"
      @click.stop
    >
      <InkPicker
        :modelValue="sourceData.collect_at"
        :formatter="(val: CollectAt | null) => (val ? CollectAt.format(val) : 'click to set')"
        displayValueAs="inline-text"
      >
        <template #default="{ closePopup }">
          <div class="collect-at__title">Config source auto collecting</div>
          <collectAtForm
            v-if="collectAtModel !== null"
            v-model="collectAtModel"
          />
          <div v-else>Auto collect off.</div>
          <div class="collect-at__actions">
            <InkSwitch v-model="toggleAutoCollect" size="md" />
            <InkButton text="Cancel" type="subtle" @click="closePopup" />
            <InkButton
              text="Confirm"
              type="primary"
              @click="
                onConfirmCollectAt();
                closePopup();
              "
            />
          </div>
        </template>
      </InkPicker>
    </InkField>

    <div class="source-card__config">
      <pre class="source-card__config-text">{{ formattedConfig }}</pre>
    </div>

    <div
      v-if="latestRunningJob"
      class="source-card__running-job"
      @click.stop="onCheckRunningJob"
    >
      {{ t("source.checkRunningJob") }}
    </div>

    <div class="source-card__operations" @click.stop>
      <div class="source-card__operations-left">
        <InkDoubleCheck
          :title="t('source.deleteConfirmTitle')"
          :message="t('source.deleteConfirmMessage')"
          :confirmText="t('common.confirm')"
          :cancelText="t('common.cancel')"
          @confirm="onDelete"
        >
          <InkButton text="Delete" type="danger" size="sm" />
        </InkDoubleCheck>
      </div>
      <div class="source-card__operations-right">
        <InkButton
          text="Edit Config"
          type="subtle"
          size="sm"
          @click="onEditConfig"
        />
        <InkButton text="Run Now" type="subtle" size="sm" @click="onRunNow" />
      </div>
    </div>
  </div>

  <InkPopup v-model:open="configPopupOpen" position="center">
    <div class="config-editor">
      <h3 class="config-editor__title">Edit Config</h3>
      <InkJsonEditor
        v-model="configModel"
        :schema="sourceType?.config_schema"
        placeholder="Enter JSON config..."
        :rows="6"
      />
      <div class="config-editor__actions">
        <InkButton
          text="Cancel"
          type="subtle"
          @click="configPopupOpen = false"
        />
        <InkButton text="Confirm" type="primary" @click="onConfirmConfig" />
      </div>
    </div>
  </InkPopup>
</template>

<style lang="scss" scoped src="./sourceCard.scss" />
