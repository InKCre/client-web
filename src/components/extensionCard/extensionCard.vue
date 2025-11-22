<template>
    <div class="extension-card" :class="{ 'extension-card--disabled': extension.disabled }">
        <header class="extension-card__header">
            <div class="extension-card__info">
                <h3 class="extension-card__id">{{ extension.id }}</h3>
                <p v-if="extension.nickname" class="extension-card__nickname">
                    {{ extension.nickname }}
                </p>
                <p class="extension-card__version">v{{ extension.version }}</p>
            </div>

            <div class="extension-card__status">
                <div class="extension-card__status-indicator" :class="{
                    'extension-card__status-indicator--enabled': !extension.disabled,
                    'extension-card__status-indicator--disabled': extension.disabled
                }" />
                <span class="extension-card__status-text">
                    {{ extension.disabled ? 'DISABLED' : 'ENABLED' }}
                </span>
            </div>
        </header>

        <div class="extension-card__actions">
            <button @click="toggleEnabled" :disabled="isLoading" class="extension-card__action-btn" :class="{
                'extension-card__action-btn--primary': extension.disabled,
                'extension-card__action-btn--danger': !extension.disabled
            }">
                {{ extension.disabled ? 'ENABLE' : 'DISABLE' }}
            </button>

            <button @click="editConfig" :disabled="isLoading" class="extension-card__action-btn">
                EDIT CONFIG
            </button>
        </div>

        <div v-if="showConfig && extension.config" class="extension-card__config">
            <div class="extension-card__config-header">
                CONFIGURATION:
            </div>
            <pre class="extension-card__config-content">{{ formatConfig(extension.config) }}</pre>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import type { ExtensionCardProps, ExtensionCardEmits } from "./extensionCardTypes";

// Props & Emits
const props = withDefaults(defineProps<ExtensionCardProps>(), {
    showConfig: false,
});

const emit = defineEmits<ExtensionCardEmits>();

// Local State
const isLoading = ref(false);

// Methods
const toggleEnabled = async () => {
    if (isLoading.value) return;

    isLoading.value = true;
    try {
        const newEnabled = !props.extension.disabled;
        emit('toggle-enabled', newEnabled);
    } finally {
        isLoading.value = false;
    }
};

const editConfig = () => {
    emit('edit-config', props.extension);
};

const formatConfig = (config: Record<string, any>) => {
    return JSON.stringify(config, null, 2);
};
</script>

<style lang="scss" scoped src="./extensionCard.scss" />