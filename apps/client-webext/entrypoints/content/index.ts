import { createApp } from 'vue'
import { configureApp } from '@/logic/common-setup'
import { initializeExtensionConfig } from '@/logic/storage'
import App from './ContentScripts.vue'

export default defineContentScript({
  matches: ['<all_urls>'],
  async main(ctx) {
    await initializeExtensionConfig()

    const ui = createIntegratedUi(ctx, {
      position: 'inline',
      anchor: 'body',
      onMount: (container: HTMLElement) => {
        // Create the app and mount it to the UI container
        const app = createApp(App)
        configureApp(app)
        app.mount(container)
        return app
      },
      onRemove: (app?: ReturnType<typeof createApp>) => {
        // Unmount the app when the UI is removed
        app?.unmount()
      },
    })
    // Call mount to add the UI to the DOM
    ui.mount()
  },
})
