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
import InkHeader from "@/components/common/inkHeader/inkHeader.vue";

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
/* BEM: block = extensions-view */
.extensions-view {
    min-height: 100vh;
    background: sys-var('color', 'surface', 'bg', 'base');
    @include font-mono;
}

.extensions-view__error {
    @include card-flat;
    background: sys-var('color', 'surface', 'bg', 'strong');
    color: sys-var('color', 'content', 'text', 'primary');
    padding: sys-var('space', 'scale', 'md') sys-var('space', 'scale', 'xl');
    border-bottom: sys-var('space', 'border', 'thin') solid sys-var('color', 'surface', 'border', 'base');
    text-align: center;
    @include text-small-caps;
}

.extensions-view__loading {
    @include card-flat;
    padding: sys-var('space', 'scale', 'xl');
    display: flex;
    align-items: center;
    justify-content: center;
    gap: sys-var('space', 'scale', 'md');
    background: sys-var('color', 'surface', 'bg', 'muted');

    .extensions-view__loading-icon {
        font-size: sys-var('type', 'display-sm', 'size');
        animation: pulse 2s infinite;
    }

    .extensions-view__loading-text {
        @include text-small-caps;
        color: sys-var('color', 'content', 'text', 'muted');
    }
}

.extensions-view__content {
    padding: sys-var('space', 'scale', 'xl');
    display: flex;
    flex-direction: column;
    gap: sys-var('space', 'scale', 'xl');
    max-width: 1200px;
    margin: 0 auto;
}

.extensions-view__section {
    @include card-flat;
    border: sys-var('space', 'border', 'thin') solid sys-var('color', 'surface', 'border', 'base');
    background: sys-var('color', 'surface', 'bg', 'base');
    padding: sys-var('space', 'scale', 'lg');
}

.extensions-view__section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: sys-var('space', 'scale', 'lg');
}

.extensions-view__section-title {
    @include text-mono-caps;
    font-size: sys-var('type', 'title-sm', 'size');
    font-weight: 600;
    color: sys-var('color', 'content', 'text', 'primary');
    margin: 0 0 sys-var('space', 'scale', 'lg') 0;
}

.extensions-view__refresh-btn {
    @include text-small-caps;
    padding: sys-var('space', 'scale', 'sm') sys-var('space', 'scale', 'md');
    border: sys-var('space', 'border', 'thin') solid sys-var('color', 'surface', 'border', 'base');
    background: sys-var('color', 'surface', 'bg', 'base');
    color: sys-var('color', 'content', 'text', 'primary');
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover:not(:disabled) {
        background: sys-var('color', 'surface', 'bg', 'raised');
        border-color: sys-var('color', 'action', 'state', 'hover');
    }

    &:disabled {
        opacity: sys-var('opacity', 'muted');
        cursor: not-allowed;
    }
}

.extensions-view__install-form {
    display: flex;
    flex-direction: column;
    gap: sys-var('space', 'scale', 'md');
}

.extensions-view__form-row {
    display: flex;
    gap: sys-var('space', 'scale', 'md');
    align-items: center;
}

.extensions-view__input {
    @include font-mono;
    padding: sys-var('space', 'scale', 'sm');
    border: sys-var('space', 'border', 'thin') solid sys-var('color', 'surface', 'border', 'base');
    background: sys-var('color', 'surface', 'bg', 'muted');
    color: sys-var('color', 'content', 'text', 'primary');
    font-size: sys-var('type', 'body-sm', 'size');
    flex: 1;

    &::placeholder {
        color: sys-var('color', 'content', 'text', 'subtle');
        @include text-small-caps;
    }

    &:focus {
        outline: none;
        border-color: sys-var('color', 'action', 'state', 'hover');
    }

    &:disabled {
        opacity: sys-var('opacity', 'muted');
        cursor: not-allowed;
    }
}

.extensions-view__checkbox-label {
    display: flex;
    align-items: center;
    gap: sys-var('space', 'scale', 'sm');
    cursor: pointer;
}

.extensions-view__checkbox {
    margin: 0;
}

.extensions-view__checkbox-text {
    @include text-small-caps;
    color: sys-var('color', 'content', 'text', 'muted');
    font-size: sys-var('type', 'body-sm', 'size');
}

.extensions-view__install-btn {
    @include text-small-caps;
    padding: sys-var('space', 'scale', 'sm') sys-var('space', 'scale', 'lg');
    border: sys-var('space', 'border', 'thin') solid sys-var('color', 'action', 'bg', 'primary');
    background: sys-var('color', 'action', 'bg', 'primary');
    color: sys-var('color', 'surface', 'bg', 'base');
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover:not(:disabled) {
        background: sys-var('color', 'action', 'state', 'hover');
        border-color: sys-var('color', 'action', 'state', 'hover');
    }

    &:disabled {
        opacity: sys-var('opacity', 'muted');
        cursor: not-allowed;
    }
}

.extensions-view__empty {
    @include text-small-caps;
    color: sys-var('color', 'content', 'text', 'muted');
    text-align: center;
    padding: sys-var('space', 'scale', 'xl');
    background: sys-var('color', 'surface', 'bg', 'muted');
    border: sys-var('space', 'border', 'thin') solid sys-var('color', 'surface', 'border', 'subtle');
}

.extensions-view__extensions-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: sys-var('space', 'scale', 'lg');
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
        padding: sys-var('space', 'scale', 'md');
    }

    .extensions-view__section {
        padding: sys-var('space', 'scale', 'md');
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
        gap: sys-var('space', 'scale', 'sm');
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
        opacity: sys-var('opacity', 'muted');
    }
}
</style>