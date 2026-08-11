import type { ExtensionModule } from '@inkcre/core'

import './resolver'

const Extension: ExtensionModule = {
  async initialize() {},
  async activate() {},
  async deactivate() {},
  async dispose() {},
}

export default Extension
