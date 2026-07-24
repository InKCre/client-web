import { createApp } from 'vue'
import { setupApp } from '~/logic/common-setup'
import App from './Explain.vue'
import '~/styles'

const app = createApp(App)
await setupApp(app)
app.mount('#app')
