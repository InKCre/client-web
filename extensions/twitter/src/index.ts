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

import { Resolver, type ExtensionModule } from '@inkcre/core'
import { TweetResolver } from './resolver'
import TwitterSetupWizard from './components/twitterSetupWizard/twitterSetupWizard.vue'

const Extension: ExtensionModule = {
  setup: {
    component: TwitterSetupWizard,
  },

  async initialize() {
    Resolver.register(TweetResolver.type, TweetResolver)
  },

  async activate() {
    console.log('[Twitter Extension] Activated')
  },

  async deactivate() {
    console.log('[Twitter Extension] Deactivated')
  },

  async dispose() {
    console.log('[Twitter Extension] Disposed')
    Resolver.unregister(TweetResolver.type, TweetResolver)
  },
}

export default Extension
