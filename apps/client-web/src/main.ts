import { createApp } from 'vue'
import App from './App.vue'
import i18n from './locales'
import router from './router'
import { setInfoBaseRouter, store } from '@inkcre/core'
import { createInfoBaseRouterAdapter } from './router'

// 样式
import 'uno.css'
import '@inkcre/ui-web/styles'
import '@vue-flow/core/dist/style.css'

const app = createApp(App)

app.use(i18n)
app.use(store)
app.use(router)
setInfoBaseRouter(createInfoBaseRouterAdapter(router))

// Initialize core package
import { initializeCore, shutdownCore } from './core'
import { shouldLoadPeerConfigAtBootstrap } from './core'
await initializeCore({
  // Settings is the recovery surface for invalid or incomplete bootstrap
  // credentials. It must mount without first contacting the configured Peer.
  loadPeerConfig: shouldLoadPeerConfigAtBootstrap(window.location.pathname),
})
app.mount('#app')

import { getExtensionHost } from './core'
const extensionHost = getExtensionHost()
extensionHost.startup().catch((error) => {
  console.error('[Web Extension Host] Startup failed:', error)
})

window.addEventListener('beforeunload', () => {
  shutdownCore()
  void extensionHost.shutdown()
})
