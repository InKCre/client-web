import { defineConfig, presetUno, presetAttributify, presetIcons } from 'unocss'

const colors = {
  primary: 'var(--sys-color-action-bg-primary)',
  'primary-hover': 'var(--sys-color-action-state-hover)',
  surface: 'var(--sys-color-surface-bg-base)',
  'surface-muted': 'var(--sys-color-surface-bg-muted)',
  border: 'var(--sys-color-surface-border-strong)',
  text: 'var(--sys-color-content-text-primary)',
  'text-muted': 'var(--sys-color-content-text-muted)',
}

const spacing = {
  '3xs': 'var(--sys-space-scale-3xs)',
  '2xs': 'var(--sys-space-scale-2xs)',
  xs: 'var(--sys-space-scale-xs)',
  sm: 'var(--sys-space-scale-sm)',
  md: 'var(--sys-space-scale-md)',
  lg: 'var(--sys-space-scale-lg)',
  xl: 'var(--sys-space-scale-xl)',
  '2xl': 'var(--sys-space-scale-2xl)',
}

export default defineConfig({
  presets: [presetUno(), presetAttributify(), presetIcons()],
  theme: {
    colors,
    spacing,
    fontFamily: {
      sans: 'var(--sys-type-body-md-family)',
      mono: 'var(--sys-type-code-family)',
    },
    borderRadius: {
      sm: 'var(--sys-space-radius-xs)',
      md: 'var(--sys-space-radius-sm)',
      lg: 'var(--sys-space-radius-md)',
      full: 'var(--sys-space-radius-full)',
    },
    boxShadow: {
      sm: 'var(--sys-elevation-low)',
      md: 'var(--sys-elevation-mid)',
      lg: 'var(--sys-elevation-high)',
    },
  },
  shortcuts: [
    ['app-shell', 'font-sans text-text bg-surface'],
    ['card-surface', 'bg-surface-muted rounded-md shadow-sm'],
  ],
  preflights: [
    {
      getCSS: () => ':root{color-scheme:light dark;}',
    },
  ],
})
