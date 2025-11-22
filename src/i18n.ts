import { createI18n } from 'vue-i18n'

export const SUPPORT_LOCALES = ['en', 'zh-CN'] as const
export type SupportLocale = typeof SUPPORT_LOCALES[number]

const STORAGE_KEY = 'inkcre-locale'

// Locale display names for UI
export const LOCALE_NAMES: Record<SupportLocale, string> = {
  'en': 'English',
  'zh-CN': '简体中文',
}

// Get saved locale from localStorage or use browser default
function getInitialLocale(): SupportLocale {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved && SUPPORT_LOCALES.includes(saved as SupportLocale)) {
    return saved as SupportLocale
  }
  
  // Try to match browser language with explicit mapping
  const browserLang = navigator.language
  
  // Exact match first
  if (SUPPORT_LOCALES.includes(browserLang as SupportLocale)) {
    return browserLang as SupportLocale
  }
  
  // Language code prefix matching
  const langCode = browserLang.split('-')[0]
  if (langCode === 'zh') {
    return 'zh-CN' // Default to Simplified Chinese for Chinese variants
  }
  
  // Default fallback
  return 'en'
}

// Create i18n instance with lazy loading
const i18n = createI18n({
  legacy: false, // Use Composition API
  locale: getInitialLocale(),
  fallbackLocale: 'en',
  messages: {}, // Start with empty messages, load lazily
})

// Cache loaded locales
const loadedLanguages: Set<string> = new Set()

// Function to load locale messages
export async function loadLocaleMessages(locale: SupportLocale) {
  // Return if already loaded
  if (loadedLanguages.has(locale)) {
    return
  }

  // Load the locale messages
  try {
    const messages = await import(`./locales/${locale}.json`)
    i18n.global.setLocaleMessage(locale, messages.default)
    loadedLanguages.add(locale)
  } catch (error) {
    console.error(
      `Failed to load locale "${locale}". Falling back to already loaded locales.`,
      'Available locales:',
      Array.from(loadedLanguages),
      'Error:',
      error
    )
  }
}

// Function to change locale
export async function setLocale(locale: SupportLocale) {
  // Load locale messages if not loaded
  await loadLocaleMessages(locale)
  
  // Set the locale
  i18n.global.locale.value = locale
  
  // Save to localStorage
  localStorage.setItem(STORAGE_KEY, locale)
  
  // Update document lang attribute
  document.querySelector('html')?.setAttribute('lang', locale)
}

// Load initial locale on startup
loadLocaleMessages(getInitialLocale())

export default i18n
