import { createApp } from 'vue'
import App from './App.vue'
import i18n from './locales'
import router from './router'
import { store } from '@inkcre/core'

// 样式
import 'uno.css'
import '@inkcre/ui-web/styles'
import '@vue-flow/core/dist/style.css'

const app = createApp(App)

app.use(i18n)
app.use(store)
app.use(router)

// Initialize core package
import { initializeCore, shouldLoadClientConfigAtBootstrap } from './core'
await initializeCore({
  // Settings is the recovery surface for invalid or incomplete bootstrap
  // credentials. It must mount without first contacting the configured Peer.
  loadClientConfig: shouldLoadClientConfigAtBootstrap(window.location.pathname),
})
app.mount('#app')

import { getExtensionHost, startExtensionHost } from './core'
const extensionHost = getExtensionHost()
startExtensionHost().catch((error) => {
  console.error('[Web Extension Host] Startup failed:', error)
})

window.addEventListener('beforeunload', () => {
  void extensionHost.shutdown()
})
