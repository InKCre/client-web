<script setup lang="ts">
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import InkForm from "@/components/common/InkForm/InkForm.vue";
import InkInput from "@/components/common/InkInput/InkInput.vue";
import InkButton from "@/components/common/inkButton/inkButton.vue";
import InkPopup from "@/components/common/InkPopup/InkPopup.vue";
import { installExtensionEmits } from "./installExtension";
import { ExtensionForm } from "@/business/extension";

const emit = defineEmits(installExtensionEmits);
const { t } = useI18n();

// --- data ---
const popupOpen = ref(false);
const form = ref(new ExtensionForm({ id: "", version: "" }));
const isLoading = ref(false);

// --- methods ---
const onOpenPopup = () => {
  form.value = new ExtensionForm({ id: "", version: "" });
  popupOpen.value = true;
};

const onSubmit = async () => {
  isLoading.value = true;
  try {
    await form.value.install();
    popupOpen.value = false;
    emit("install");
  } catch (error) {
    // Error handling - show user-friendly message
    console.error("Failed to install extension:", error);
  } finally {
    isLoading.value = false;
  }
};

const onCancel = () => {
  popupOpen.value = false;
};
</script>

<template>
  <div class="install-extension">
    <InkButton
      @click="onOpenPopup"
      :text="t('extension.installNew')"
      type="primary"
    />

    <InkPopup
      :open="popupOpen"
      :title="t('extension.installExtensionTitle')"
      @confirm="onSubmit"
      @cancel="onCancel"
    >
      <InkForm>
        <InkInput
          v-model="form.id"
          :label="t('extension.extensionId')"
          required
        />
        <InkInput v-model="form.version" :label="t('extension.version')" />
      </InkForm>
    </InkPopup>
  </div>
</template>

<style lang="scss" scoped src="./installExtension.scss" />
