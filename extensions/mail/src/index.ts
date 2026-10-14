import { Resolver, type ExtensionModule } from '@inkcre/core'
import {
  EmailResolver,
  MailboxResolver,
  EmailAddressResolver,
  MailFlagResolver,
  MailMimePartResolver,
} from './resolver'

const resolvers = [
  EmailResolver,
  MailboxResolver,
  EmailAddressResolver,
  MailFlagResolver,
  MailMimePartResolver,
]

const Extension: ExtensionModule = {
  async initialize() {
    for (const resolver of resolvers) Resolver.register(resolver.type, resolver)
  },
  async activate() {},
  async deactivate() {},
  async dispose() {
    // Host compensation also calls dispose after a partially failed initialize.
    for (const resolver of resolvers) Resolver.unregister(resolver.type, resolver)
  },
}

export default Extension
