<script setup lang="ts">
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import { InkForm, InkInput, InkButton } from "@inkcre/web-design";
import { installExtensionEmits } from "./installExtension";
import { InstallExtensionForm } from "@inkcre/core";

const emit = defineEmits(installExtensionEmits);
const { t } = useI18n();

// --- data ---
const form = ref(new InstallExtensionForm({ id: "", version: "" }));
const isLoading = ref(false);

// --- methods ---
const onSubmit = async () => {
  isLoading.value = true;
  try {
    await form.value.install();
    emit("install");
    // Reset form on success
    form.value = new InstallExtensionForm({ id: "", version: "" });
  } catch (error) {
    // Error handling - show user-friendly message
    console.error("Failed to install extension:", error);
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div class="install-extension">
    <h2 class="title">{{ t("extension.installExtensionTitle") }}</h2>

    <InkForm class="form">
      <InkInput
        v-model="form.id"
        :label="t('extension.extensionId')"
        required
      />
      <InkInput
        v-model="form.version"
        :label="t('extension.version')"
        :placeholder="t('extension.versionPlaceholder')"
      />
    </InkForm>

    <div class="footer">
      <InkButton
        :text="t('extension.installNew')"
        theme="primary"
        size="md"
        @click="onSubmit"
        :loading="isLoading"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped src="./installExtension.scss" />
