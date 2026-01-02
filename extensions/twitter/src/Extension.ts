/**
 * Twitter Extension Entry Point
 *
 * Module Federation remote entry that implements IExtension interface.
 * This is the main export loaded by the host application.
 */

import type { IExtension } from "@host/business/extension";

// Import resolver to trigger @ResolverManager.registry() decorator registration
import "./resolver";

const Extension: IExtension = {
  async initialize() {
    console.log("[Twitter Extension] Initializing...");
    // Resolver registration happens via decorator side effect
  },

  async activate() {
    console.log("[Twitter Extension] Activated");
  },

  async deactivate() {
    console.log("[Twitter Extension] Deactivated");
  },

  async dispose() {
    console.log("[Twitter Extension] Disposed");
    // Cleanup resources if needed
  },
};

export default Extension;
