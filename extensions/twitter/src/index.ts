/**
 * Twitter Extension
 *
 */

/**
 * Twitter Extension Entry Point
 *
 * Module Federation remote entry that implements ExtensionModule.
 * This is the main export loaded by the host application.
 */

import { type ExtensionModule } from '@inkcre/core'
import './resolver'
import TwitterSetupWizard from './components/twitterSetupWizard/twitterSetupWizard.vue'

const Extension: ExtensionModule = {
  setup: { component: TwitterSetupWizard },
  async initialize() {},

  async activate() {
    console.log('[Twitter Extension] Activated')
  },

  async deactivate() {
    console.log('[Twitter Extension] Deactivated')
  },

  async dispose() {
    console.log('[Twitter Extension] Disposed')
    // Cleanup resources if needed
  },
}

export default Extension
