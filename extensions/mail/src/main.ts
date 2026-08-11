import { bootstrapExtension } from '@inkcre/ext-dev-utils'
import '@inkcre/ui-web/styles'

import App from './DevApp.vue'
import Extension from './index'

void bootstrapExtension({
  rootComponent: App,
  extensionModule: Extension,
  routes: [
    {
      path: '/',
      component: () => import('./views/DevHome.vue'),
    },
  ],
}).catch((error) => console.error('Failed to bootstrap Mail extension:', error))
