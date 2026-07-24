import { createApp } from 'vue'
import { setupApp } from '@/logic/common-setup'
import '~/styles'
import Options from './Options.vue'

const app = createApp(Options)
await setupApp(app)
app.mount('#app')
