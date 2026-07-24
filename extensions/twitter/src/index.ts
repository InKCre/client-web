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

const Extension: ExtensionModule = {
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
