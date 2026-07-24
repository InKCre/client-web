import { createApp } from 'vue'
import { setupApp } from '~/logic/common-setup'
import '~/styles'
import App from './Popup.vue'

const app = createApp(App)
await setupApp(app)
app.mount('#app')
