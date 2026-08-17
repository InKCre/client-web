export const twitterSetupWizardEmits = {
  close: () => true,
} as const

export const TWITTER_SETUP_STEPS = [
  'Prepare',
  'Connect account',
  'Bookmark Source',
  'Review and start',
] as const
