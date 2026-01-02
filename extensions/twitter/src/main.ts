/**
 * Twitter Extension Dev Entry Point
 *
 * This file is the entry point for development mode.
 * It bootstraps the extension in a standalone playground environment.
 */

import { bootstrapExtension } from "@inkcre/ext-dev-utils";
import Extension from "./Extension";
import App from "./DevApp.vue";

// Import design system styles
import "@inkcre/web-design/styles";

bootstrapExtension({
  rootComponent: App,
  extensionModule: Extension,
  routes: [
    {
      path: "/",
      component: () => import("./views/DevHome.vue"),
    },
  ],
});
