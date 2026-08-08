import runtimeContract from './runtime-contract.generated.json'

export const peerJwtContract = runtimeContract.jwt
export const databaseRuntimeContract = {
  format: runtimeContract.format,
  revision: runtimeContract.revision,
  protocol: {
    format: runtimeContract.protocol.format,
    schema: runtimeContract.protocol.schema,
  },
  jwt: peerJwtContract,
}

export type DatabaseRuntimeContract = typeof databaseRuntimeContract
