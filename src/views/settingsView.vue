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
import InkHeader from '@/components/inkHeader/inkHeader.vue'

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
@use '@/styles/index.scss' as *;

.settings-view {
  min-height: calc(100vh - 80px);
  background: var(--color-background);
  padding: var(--space-xl);
}

.settings-view__container {
  max-width: 800px;
  margin: 0 auto;
}

.settings-view__main {
  display: flex;
  flex-direction: column;
  gap: var(--space-xl);
  margin-top: var(--space-2xl);
}

.settings-view__section {
  @include card-flat;
  border: 1px solid var(--color-border);
  background: var(--color-background);
  padding: var(--space-lg);
}

.settings-view__section-title {
  @include text-mono-caps;
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--color-text);
  margin: 0 0 var(--space-sm) 0;
}

.settings-view__section-description {
  @include text-small-caps;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  margin: 0 0 var(--space-lg) 0;
}

.settings-view__language-selector {
  display: flex;
  gap: var(--space-md);
  flex-wrap: wrap;
}

.settings-view__language-btn {
  @include text-small-caps;
  padding: var(--space-md) var(--space-lg);
  border: 1px solid var(--color-border);
  background: var(--color-background);
  color: var(--color-text);
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 120px;

  &:hover {
    background: var(--color-background-muted);
    border-color: var(--color-primary-light);
  }

  &--active {
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: var(--color-background);
    font-weight: 600;

    &:hover {
      background: var(--color-primary-light);
      border-color: var(--color-primary-light);
    }
  }
}

@include mobile {
  .settings-view {
    padding: var(--space-lg);
  }

  .settings-view__language-selector {
    flex-direction: column;
  }

  .settings-view__language-btn {
    width: 100%;
  }
}
</style>
