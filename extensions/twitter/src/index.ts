/**
 * Twitter Extension
 *
 */

/**
 * Twitter Extension Entry Point
 *
 * Module Federation remote entry that implements IExtension interface.
 * This is the main export loaded by the host application.
 */

import { type IExtension } from "@inkcre/core";
import "./resolver";

// @ts-ignore
console.log(__FEDERATION__.__SHARE__);

const Extension: IExtension = {
  async initialize() {},

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
