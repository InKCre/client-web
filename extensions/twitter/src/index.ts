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

import { type IExtension, resolverManager } from "@inkcre/core";
import { TweetResolver } from "./resolver";

const Extension: IExtension = {
  async initialize() {},

  async activate() {
    // TODO wait for package core ready
    resolverManager.register("extensions.twitter.tweet", TweetResolver);
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
