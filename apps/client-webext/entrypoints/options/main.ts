import { createApp } from 'vue'
import { setupApp } from '@/logic/common-setup'
import '~/styles'
import Options from './Options.vue'

const app = createApp(Options)
setupApp(app)
app.mount('#app')
