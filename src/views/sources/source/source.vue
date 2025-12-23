<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { useAsyncState } from "@vueuse/core";
import { useEAsyncState } from "@/composables/use-async-state";
import {
  InkLoading,
  InkButton,
  InkField,
  InkInput,
  InkJsonEditor,
  InkDoubleCheck,
  InkPopup,
  InkPicker,
  InkSwitch,
} from "@inkcre/web-design";
import collectAtForm from "@/components/info-base/source/collectAtForm/collectAtForm.vue";
import newCollectJob from "@/components/info-base/source/newCollectJob/newCollectJob.vue";
import {
  Source,
  SourceType,
  SourceCollectJob,
  CollectAt,
  SourceCollectJobStatus,
} from "@/business/info-base/source";
import { useCloned } from "@vueuse/core";
import dayjs from "dayjs";
import type { PaginationState } from "@/views/sources/source/source";

const route = useRoute();
const router = useRouter();
const { t } = useI18n();

// --- data ---
const sourceId = computed(() => Number(route.params.id));
const newJobPopupOpen = ref(false);
const configPopupOpen = ref(false);
const configModel = ref("");
const nicknameModel = ref("");
const collectAtModel = ref<CollectAt | null>(null);

const pagination = ref<PaginationState>({
  page: 1,
  pageSize: 10,
  total: 0,
});

const { state: source, execute: refetchSource } = useEAsyncState(
  () => Source.get(sourceId.value),
  null,
  { immediate: true, useLast: true }
);

const {
  state: sourceType,
  execute: refetchSourceType,
  isLoading: sourceTypeLoading,
} = useAsyncState(
  async () => {
    if (source.value?.type) {
      return await SourceType.get(source.value.type);
    }
    return null;
  },
  null,
  { shallow: false }
);

const {
  state: collectJobs,
  execute: refetchCollectJobs,
  isLoading: collectJobsLoading,
} = useAsyncState(
  async () => {
    const offset = (pagination.value.page - 1) * pagination.value.pageSize;
    const result = await SourceCollectJob.getBySource(sourceId.value, {
      limit: pagination.value.pageSize,
      offset,
      order: "desc",
    });
    pagination.value.total = result.count;
    return result.data;
  },
  [],
  { shallow: false }
);

// --- computed ---
const formattedConfig = computed(() => {
  return JSON.stringify(source.value?.config || {}, null, 2);
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

const totalPages = computed(() =>
  Math.ceil(pagination.value.total / pagination.value.pageSize)
);

const canGoPrev = computed(() => pagination.value.page > 1);
const canGoNext = computed(() => pagination.value.page < totalPages.value);

// --- methods ---
const formatDate = (date: Date | null) => {
  if (!date) return t("collectJob.notAvailable");
  return dayjs(date).format("YYYY-MM-DD HH:mm:ss");
};

const onNicknameSave = (newNickname: string) => {
  if (source.value) {
    source.value.nickname = newNickname;
    source.value.save();
  }
};

const onEditConfig = () => {
  configModel.value = formattedConfig.value;
  configPopupOpen.value = true;
};

const onConfirmConfig = () => {
  try {
    const parsedConfig = JSON.parse(configModel.value);
    source.value!.config = parsedConfig;
    source.value!.save();
    configPopupOpen.value = false;
  } catch (error) {
    console.error("Invalid JSON:", error);
    // TODO: Show error toast to user
  }
};

const onConfirmCollectAt = () => {
  source.value!.collect_at = useCloned(collectAtModel.value).cloned.value;
  source.value!.save();
};

const onDelete = async () => {
  await source.value!.delete();
  router.push("/sources");
};

const onNewJob = () => {
  newJobPopupOpen.value = true;
};

const onJobCreated = (job: SourceCollectJob) => {
  newJobPopupOpen.value = false;
  router.push(`/sources/collectJob/${job.id}`);
};

const goToJob = (jobId: number) => {
  router.push(`/sources/collectJob/${jobId}`);
};

const goToPrevPage = () => {
  if (canGoPrev.value) {
    pagination.value.page--;
  }
};

const goToNextPage = () => {
  if (canGoNext.value) {
    pagination.value.page++;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case SourceCollectJobStatus.PENDING:
      return "status--pending";
    case SourceCollectJobStatus.RUNNING:
      return "status--running";
    case SourceCollectJobStatus.FINISHED:
      return "status--finished";
    case SourceCollectJobStatus.FAILED:
      return "status--failed";
    default:
      return "";
  }
};

// --- watchers ---
watch(
  () => source.value?.type,
  () => {
    if (source.value?.type) {
      refetchSourceType();
    }
  },
  { immediate: true }
);

watch(
  () => source.value?.collect_at,
  (newVal) => {
    collectAtModel.value = newVal ? useCloned(newVal).cloned.value : null;
  },
  { immediate: true }
);

watch(
  () => source.value?.nickname,
  (newVal) => {
    nicknameModel.value = newVal || "";
  },
  { immediate: true }
);

watch(
  () => pagination.value.page,
  () => {
    refetchCollectJobs();
  }
);
</script>

<template>
  <main class="source-view">
    <div v-if="!source" class="source-view__loading">
      <InkLoading />
    </div>
    <template v-else-if="source">
      <!-- Left Section: Source Details -->
      <section class="source-view__details">
        <div class="details__header">
          <h2 class="details__title">{{ t("source.detailTitle") }}</h2>
        </div>

        <InkField :label="t('source.type')">
          <span class="details__value">{{ source.type }}</span>
        </InkField>

        <InkField :label="t('source.nickname')">
          <InkInput
            :modelValue="nicknameModel"
            type="inline"
            :placeholder="t('source.nicknamePlaceholder')"
            @update:modelValue="
              (value: string) => {
                nicknameModel = value;
                onNicknameSave(value);
              }
            "
          >
            <span class="details__value">{{ nicknameModel }}</span>
          </InkInput>
        </InkField>

        <InkField :label="t('source.id')">
          <span class="details__value">#{{ source.id }}</span>
        </InkField>

        <InkField :label="t('source.collectAt')" layout="inline">
          <InkPicker
            :modelValue="source.collect_at"
            :formatter="(val: CollectAt | null) => (val ? CollectAt.format(val) : t('source.collectAtNotSet'))"
            displayValueAs="inline-text"
          >
            <template #default="{ closePopup }">
              <div class="collect-at__title">
                {{ t("source.collectAtConfig") }}
              </div>
              <collectAtForm
                v-if="collectAtModel !== null"
                v-model="collectAtModel"
              />
              <div v-else>{{ t("source.collectAtOff") }}</div>
              <div class="collect-at__actions">
                <InkSwitch v-model="toggleAutoCollect" size="md" />
                <InkButton
                  :text="t('common.cancel')"
                  type="subtle"
                  @click="closePopup"
                />
                <InkButton
                  :text="t('common.confirm')"
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

        <InkField :label="t('source.config')">
          <div class="details__config">
            <pre class="details__config-text">{{ formattedConfig }}</pre>
          </div>
        </InkField>

        <div class="details__actions">
          <InkButton
            :text="t('source.editConfig')"
            type="subtle"
            size="sm"
            @click="onEditConfig"
          />
          <InkDoubleCheck
            :title="t('source.deleteConfirmTitle')"
            :message="t('source.deleteConfirmMessage')"
            :confirmText="t('common.confirm')"
            :cancelText="t('common.cancel')"
            @confirm="onDelete"
          >
            <InkButton :text="t('source.delete')" type="danger" size="sm" />
          </InkDoubleCheck>
        </div>
      </section>

      <!-- Right Section: Collect Jobs -->
      <section class="source-view__jobs">
        <div class="jobs__header">
          <h3 class="jobs__title">{{ t("source.collectJobs") }}</h3>
          <InkButton
            :text="t('source.newJob')"
            type="primary"
            size="md"
            class="w-full"
            @click="onNewJob"
          />
        </div>

        <div v-if="collectJobsLoading" class="jobs__loading">
          <InkLoading />
        </div>
        <div v-else-if="collectJobs.length === 0" class="jobs__empty">
          <span>{{ t("source.noJobs") }}</span>
        </div>
        <div v-else class="jobs__list">
          <div
            v-for="job in collectJobs"
            :key="job.id"
            class="job-item"
            @click="goToJob(job.id)"
          >
            <div class="job-item__header">
              <span class="job-item__id">#{{ job.id }}</span>
              <span class="job-item__status" :class="getStatusColor(job.status)">
                {{ job.status }}
              </span>
            </div>
            <div class="job-item__dates">
              <span class="job-item__date">
                {{ t("collectJob.createdAt") }}: {{ formatDate(job.created_at) }}
              </span>
            </div>
          </div>
        </div>

        <div v-if="totalPages > 1" class="jobs__pagination">
          <InkButton
            :text="t('source.prevPage')"
            type="subtle"
            size="sm"
            :disabled="!canGoPrev"
            @click="goToPrevPage"
          />
          <span class="jobs__pagination-info">
            {{ t("source.pageInfo", { page: pagination.page, total: totalPages }) }}
          </span>
          <InkButton
            :text="t('source.nextPage')"
            type="subtle"
            size="sm"
            :disabled="!canGoNext"
            @click="goToNextPage"
          />
        </div>
      </section>
    </template>
  </main>

  <!-- Config Editor Popup -->
  <InkPopup v-model:open="configPopupOpen" position="center">
    <div class="config-editor">
      <h3 class="config-editor__title">{{ t("source.editConfig") }}</h3>
      <InkJsonEditor
        v-model="configModel"
        :schema="sourceType?.config_schema"
        :placeholder="t('source.configPlaceholder')"
        :rows="6"
      />
      <div class="config-editor__actions">
        <InkButton
          :text="t('common.cancel')"
          type="subtle"
          @click="configPopupOpen = false"
        />
        <InkButton
          :text="t('common.save')"
          type="primary"
          @click="onConfirmConfig"
        />
      </div>
    </div>
  </InkPopup>

  <!-- New Job Popup -->
  <InkPopup v-model:open="newJobPopupOpen" position="center">
    <div class="new-job-popup">
      <h3 class="new-job-popup__title">{{ t("source.newJobTitle") }}</h3>
      <newCollectJob :sourceId="sourceId" @create="onJobCreated" />
      <div class="new-job-popup__actions">
        <InkButton
          :text="t('common.cancel')"
          type="subtle"
          @click="newJobPopupOpen = false"
        />
      </div>
    </div>
  </InkPopup>
</template>

<style lang="scss" scoped src="./source.scss" />
