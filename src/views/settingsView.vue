<template>
  <div class="settings-view">
    <div class="settings-view__container">
      <ink-header mode="section" :title="t('settings.title')" />

      <main class="settings-view__main">
        <section class="settings-view__section">
          <h3 class="settings-view__section-title">{{ t('settings.languageLabel') }}</h3>
          <p class="settings-view__section-description">{{ t('settings.languageDescription') }}</p>

          <div class="settings-view__language-selector">
            <button v-for="locale in supportedLocales" :key="locale.value" @click="changeLanguage(locale.value)" :class="[
              'settings-view__language-btn',
              { 'settings-view__language-btn--active': currentLocale === locale.value }
            ]">
              {{ locale.label }}
            </button>
          </div>
        </section>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { setLocale, SUPPORT_LOCALES, LOCALE_NAMES, type SupportLocale } from '@/locales'
import InkHeader from '@/components/common/inkHeader/inkHeader.vue'

const { t, locale } = useI18n()

const currentLocale = computed(() => locale.value)

const supportedLocales = computed(() =>
  SUPPORT_LOCALES.map(value => ({
    value,
    label: LOCALE_NAMES[value]
  }))
)

const changeLanguage = async (newLocale: SupportLocale) => {
  await setLocale(newLocale)
}
</script>

<style lang="scss" scoped>
.settings-view {
  min-height: calc(100vh - 80px);
  background: sys-var('color', 'surface', 'bg', 'base');
  padding: sys-var('space', 'scale', 'xl');
}

.settings-view__container {
  max-width: 800px;
  margin: 0 auto;
}

.settings-view__main {
  display: flex;
  flex-direction: column;
  gap: sys-var('space', 'scale', 'xl');
  margin-top: sys-var('space', 'scale', '2xl');
}

.settings-view__section {
  @include card-flat;
  border: sys-var('space', 'border', 'thin') solid sys-var('color', 'surface', 'border', 'base');
  background: sys-var('color', 'surface', 'bg', 'base');
  padding: sys-var('space', 'scale', 'lg');
}

.settings-view__section-title {
  @include text-mono-caps;
  font-size: sys-var('type', 'title-sm', 'size');
  font-weight: 600;
  color: sys-var('color', 'content', 'text', 'primary');
  margin: 0 0 sys-var('space', 'scale', 'sm') 0;
}

.settings-view__section-description {
  @include text-small-caps;
  color: sys-var('color', 'content', 'text', 'muted');
  font-size: sys-var('type', 'body-sm', 'size');
  margin: 0 0 sys-var('space', 'scale', 'lg') 0;
}

.settings-view__language-selector {
  display: flex;
  gap: sys-var('space', 'scale', 'md');
  flex-wrap: wrap;
}

.settings-view__language-btn {
  @include text-small-caps;
  padding: sys-var('space', 'scale', 'md') sys-var('space', 'scale', 'lg');
  border: sys-var('space', 'border', 'thin') solid sys-var('color', 'surface', 'border', 'base');
  background: sys-var('color', 'surface', 'bg', 'base');
  color: sys-var('color', 'content', 'text', 'primary');
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 120px;

  &:hover {
    background: sys-var('color', 'surface', 'bg', 'raised');
    border-color: sys-var('color', 'action', 'state', 'hover');
  }

  &--active {
    background: sys-var('color', 'action', 'bg', 'primary');
    border-color: sys-var('color', 'action', 'bg', 'primary');
    color: sys-var('color', 'surface', 'bg', 'base');
    font-weight: 600;

    &:hover {
      background: sys-var('color', 'action', 'state', 'hover');
      border-color: sys-var('color', 'action', 'state', 'hover');
    }
  }
}

@include mobile {
  .settings-view {
    padding: sys-var('space', 'scale', 'lg');
  }

  .settings-view__language-selector {
    flex-direction: column;
  }

  .settings-view__language-btn {
    width: 100%;
  }
}
</style>
