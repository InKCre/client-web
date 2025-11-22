<template>
    <div class="extensions-view">
        <!-- Header -->
        <InkHeader mode="page" title="EXTENSIONS" :navLinks="[{ to: '/', label: 'BACK_TO_HOME' }]" />

        <!-- Error Display -->
        <div v-if="errorMessage" class="extensions-view__error">
            {{ errorMessage }}
        </div>

        <!-- Loading State -->
        <div v-if="isLoading" class="extensions-view__loading">
            <span class="extensions-view__loading-icon">▢</span>
            <span class="extensions-view__loading-text">LOADING_EXTENSIONS...</span>
        </div>

        <!-- Main Content -->
        <div v-else class="extensions-view__content">
            <!-- Install Section -->
            <section class="extensions-view__section">
                <h2 class="extensions-view__section-title">INSTALL_NEW_EXTENSION</h2>

                <div class="extensions-view__install-form">
                    <div class="extensions-view__form-row">
                        <input v-model="newExtension.id" type="text" placeholder="EXTENSION_ID"
                            class="extensions-view__input" :disabled="isInstalling" />
                        <input v-model="newExtension.version" type="text" placeholder="VERSION (OPTIONAL)"
                            class="extensions-view__input" :disabled="isInstalling" />
                    </div>

                    <div class="extensions-view__form-row">
                        <label class="extensions-view__checkbox-label">
                            <input v-model="newExtension.disabled" type="checkbox" class="extensions-view__checkbox"
                                :disabled="isInstalling" />
                            <span class="extensions-view__checkbox-text">INSTALL_DISABLED</span>
                        </label>

                        <button @click="installExtension" :disabled="!newExtension.id.trim() || isInstalling"
                            class="extensions-view__install-btn">
                            {{ isInstalling ? 'INSTALLING...' : 'INSTALL' }}
                        </button>
                    </div>
                </div>
            </section>

            <!-- Extensions List -->
            <section class="extensions-view__section">
                <div class="extensions-view__section-header">
                    <h2 class="extensions-view__section-title">INSTALLED_EXTENSIONS</h2>
                    <button @click="refreshExtensions" :disabled="isLoading" class="extensions-view__refresh-btn">
                        {{ isLoading ? 'LOADING...' : 'REFRESH' }}
                    </button>
                </div>

                <div v-if="extensions.length === 0" class="extensions-view__empty">
                    NO_EXTENSIONS_INSTALLED
                </div>

                <div v-else class="extensions-view__extensions-grid">
                    <ExtensionCard v-for="extension in extensions" :key="extension.id" :extension="extension"
                        :show-config="false" @toggle-enabled="handleToggleExtension(extension, $event)"
                        @edit-config="handleEditConfig" class="extensions-view__extension-card" />
                </div>
            </section>
        </div>

        <!-- Config Editor Modal -->
        <ExtensionConfigEditor v-if="editingExtension" :extension="editingExtension" :visible="showConfigEditor"
            @close="handleCloseConfigEditor" @save="handleSaveConfig" />
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { Extension, ExtensionForm } from "@/business/extension";
import ExtensionCard from "@/components/extensionCard/extensionCard.vue";
import ExtensionConfigEditor from "@/components/extensionConfigEditor/extensionConfigEditor.vue";
import InkHeader from "@/components/inkHeader/inkHeader.vue";

// Local State
const extensions = ref<Extension[]>([]);
const isLoading = ref(false);
const isInstalling = ref(false);
const errorMessage = ref("");

// Install Form
const newExtension = ref({
    id: "",
    version: "",
    disabled: false,
});

// Config Editor
const showConfigEditor = ref(false);
const editingExtension = ref<Extension | null>(null);

// Methods
const refreshExtensions = async () => {
    isLoading.value = true;
    errorMessage.value = "";

    try {
        extensions.value = await Extension.list();
    } catch (error) {
        console.error("Failed to load extensions:", error);
        errorMessage.value = "FAILED_TO_LOAD_EXTENSIONS";
    } finally {
        isLoading.value = false;
    }
};

const installExtension = async () => {
    if (!newExtension.value.id.trim() || isInstalling.value) return;

    isInstalling.value = true;
    errorMessage.value = "";

    try {
        const form = new ExtensionForm({
            id: newExtension.value.id.trim(),
            version: newExtension.value.version.trim() || undefined,
            disabled: newExtension.value.disabled,
        });

        await form.install();

        // Reset form
        newExtension.value = {
            id: "",
            version: "",
            disabled: false,
        };

        // Refresh list
        await refreshExtensions();
    } catch (error) {
        console.error("Failed to install extension:", error);
        errorMessage.value = "FAILED_TO_INSTALL_EXTENSION";
    } finally {
        isInstalling.value = false;
    }
};

const handleToggleExtension = async (extension: Extension, enabled: boolean) => {
    errorMessage.value = "";

    try {
        const updatedExtension = enabled
            ? await extension.disable()
            : await extension.enable();

        // Update the extension in the list
        const index = extensions.value.findIndex(ext => ext.id === extension.id);
        if (index !== -1) {
            extensions.value[index] = updatedExtension;
        }
    } catch (error) {
        console.error("Failed to toggle extension:", error);
        errorMessage.value = "FAILED_TO_TOGGLE_EXTENSION";
    }
};

const handleEditConfig = (extension: Extension) => {
    editingExtension.value = extension;
    showConfigEditor.value = true;
};

const handleCloseConfigEditor = () => {
    showConfigEditor.value = false;
    editingExtension.value = null;
};

const handleSaveConfig = async (config: Record<string, any>) => {
    if (!editingExtension.value) return;

    errorMessage.value = "";

    try {
        const updatedExtension = await editingExtension.value.updateConfig(config);

        // Update the extension in the list
        const index = extensions.value.findIndex(ext => ext.id === editingExtension.value!.id);
        if (index !== -1) {
            extensions.value[index] = updatedExtension;
        }

        handleCloseConfigEditor();
    } catch (error) {
        console.error("Failed to update extension config:", error);
        errorMessage.value = "FAILED_TO_UPDATE_CONFIG";
    }
};

// Initialize
onMounted(async () => {
    await refreshExtensions();
});
</script>

<style lang="scss" scoped>
@use "@/styles/index.scss" as *;

/* BEM: block = extensions-view */
.extensions-view {
    min-height: 100vh;
    background: var(--color-background);
    @include font-mono;
}



.extensions-view__error {
    @include card-flat;
    background: var(--color-background-dark);
    color: var(--color-text);
    padding: var(--space-md) var(--space-xl);
    border-bottom: 1px solid var(--color-border);
    text-align: center;
    @include text-small-caps;
}

.extensions-view__loading {
    @include card-flat;
    padding: var(--space-xl);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-md);
    background: var(--color-background-soft);

    .extensions-view__loading-icon {
        font-size: var(--font-size-xl);
        animation: pulse 2s infinite;
    }

    .extensions-view__loading-text {
        @include text-small-caps;
        color: var(--color-text-muted);
    }
}

.extensions-view__content {
    padding: var(--space-xl);
    display: flex;
    flex-direction: column;
    gap: var(--space-xl);
    max-width: 1200px;
    margin: 0 auto;
}

.extensions-view__section {
    @include card-flat;
    border: 1px solid var(--color-border);
    background: var(--color-background);
    padding: var(--space-lg);
}

.extensions-view__section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--space-lg);
}

.extensions-view__section-title {
    @include text-mono-caps;
    font-size: var(--font-size-lg);
    font-weight: 600;
    color: var(--color-text);
    margin: 0 0 var(--space-lg) 0;
}

.extensions-view__refresh-btn {
    @include text-small-caps;
    padding: var(--space-sm) var(--space-md);
    border: 1px solid var(--color-border);
    background: var(--color-background);
    color: var(--color-text);
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover:not(:disabled) {
        background: var(--color-background-muted);
        border-color: var(--color-primary-light);
    }

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
}

.extensions-view__install-form {
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
}

.extensions-view__form-row {
    display: flex;
    gap: var(--space-md);
    align-items: center;
}

.extensions-view__input {
    @include font-mono;
    padding: var(--space-sm);
    border: 1px solid var(--color-border);
    background: var(--color-background-soft);
    color: var(--color-text);
    font-size: var(--font-size-sm);
    flex: 1;

    &::placeholder {
        color: var(--color-text-light);
        @include text-small-caps;
    }

    &:focus {
        outline: none;
        border-color: var(--color-primary-light);
    }

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
}

.extensions-view__checkbox-label {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    cursor: pointer;
}

.extensions-view__checkbox {
    margin: 0;
}

.extensions-view__checkbox-text {
    @include text-small-caps;
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
}

.extensions-view__install-btn {
    @include text-small-caps;
    padding: var(--space-sm) var(--space-lg);
    border: 1px solid var(--color-primary);
    background: var(--color-primary);
    color: var(--color-background);
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover:not(:disabled) {
        background: var(--color-primary-light);
        border-color: var(--color-primary-light);
    }

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
}

.extensions-view__empty {
    @include text-small-caps;
    color: var(--color-text-muted);
    text-align: center;
    padding: var(--space-xl);
    background: var(--color-background-soft);
    border: 1px solid var(--color-border-light);
}

.extensions-view__extensions-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: var(--space-lg);
}

.extensions-view__extension-card {
    transition: transform 0.2s ease;

    &:hover {
        transform: translateY(-2px);
    }
}

// 响应式设计
@include mobile {

    .extensions-view__content {
        padding: var(--space-md);
    }

    .extensions-view__section {
        padding: var(--space-md);
    }

    .extensions-view__form-row {
        flex-direction: column;
        align-items: stretch;
    }

    .extensions-view__extensions-grid {
        grid-template-columns: 1fr;
    }

    .extensions-view__section-header {
        flex-direction: column;
        gap: var(--space-sm);
        align-items: stretch;
    }
}

@include tablet {
    .extensions-view__extensions-grid {
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    }
}

@keyframes pulse {

    0%,
    100% {
        opacity: 1;
    }

    50% {
        opacity: 0.5;
    }
}
</style>