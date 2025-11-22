<template>
    <div class="extension-config-editor" :class="{ 'extension-config-editor--visible': visible }"
        @click="handleOverlayClick">
        <div class="extension-config-editor__modal" @click.stop>
            <header class="extension-config-editor__header">
                <h2 class="extension-config-editor__title">
                    EDIT_CONFIG: {{ extension.id }}
                </h2>
                <InkButton @click="handleClose" class="extension-config-editor__close-btn" variant="ghost">
                    CLOSE
                </InkButton>
            </header>

            <div class="extension-config-editor__content">
                <textarea v-model="configText" class="extension-config-editor__editor"
                    :class="{ 'extension-config-editor__editor--error': hasError }"
                    placeholder="Enter configuration JSON..." @input="validateConfig" />

                <div v-if="hasError" class="extension-config-editor__error">
                    INVALID_JSON: {{ errorMessage }}
                </div>

                <div class="extension-config-editor__actions">
                    <InkButton @click="handleSave" :disabled="hasError || isSaving"
                        class="extension-config-editor__action-btn extension-config-editor__action-btn--primary" variant="primary">
                        {{ isSaving ? 'SAVING...' : 'SAVE' }}
                    </InkButton>

                    <InkButton @click="handleReset" :disabled="isSaving" class="extension-config-editor__action-btn">
                        RESET
                    </InkButton>

                    <InkButton @click="handleClose" :disabled="isSaving"
                        class="extension-config-editor__action-btn extension-config-editor__action-btn--secondary" variant="ghost">
                        CANCEL
                    </InkButton>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from "vue";
import InkButton from "@/components/common/inkButton/inkButton.vue";
import type { ExtensionConfigEditorProps, ExtensionConfigEditorEmits } from "./extensionConfigEditorTypes";

// Props & Emits
const props = defineProps<ExtensionConfigEditorProps>();
const emit = defineEmits<ExtensionConfigEditorEmits>();

// Local State
const configText = ref("");
const hasError = ref(false);
const errorMessage = ref("");
const isSaving = ref(false);
const originalConfig = ref<string>("");

// Computed
const parsedConfig = computed(() => {
    if (hasError.value) return null;
    try {
        return JSON.parse(configText.value);
    } catch {
        return null;
    }
});

// Methods
const initializeConfig = () => {
    const config = props.extension.config || {};
    const formatted = JSON.stringify(config, null, 2);
    configText.value = formatted;
    originalConfig.value = formatted;
    hasError.value = false;
    errorMessage.value = "";
};

const validateConfig = () => {
    if (!configText.value.trim()) {
        hasError.value = false;
        errorMessage.value = "";
        return;
    }

    try {
        JSON.parse(configText.value);
        hasError.value = false;
        errorMessage.value = "";
    } catch (error) {
        hasError.value = true;
        errorMessage.value = (error as Error).message;
    }
};

const handleSave = async () => {
    if (hasError.value || isSaving.value) return;

    isSaving.value = true;
    try {
        const config = configText.value.trim() ? JSON.parse(configText.value) : {};
        emit('save', config);
    } finally {
        isSaving.value = false;
    }
};

const handleReset = () => {
    configText.value = originalConfig.value;
    validateConfig();
};

const handleClose = () => {
    emit('close');
};

const handleOverlayClick = () => {
    if (!isSaving.value) {
        handleClose();
    }
};

// Watchers
watch(
    () => props.visible,
    (visible) => {
        if (visible) {
            initializeConfig();
        }
    },
    { immediate: true }
);

watch(
    () => props.extension,
    () => {
        if (props.visible) {
            initializeConfig();
        }
    }
);
</script>

<style lang="scss" scoped src="./extensionConfigEditor.scss" />