import * as Client from '@ucanto/client'
import { ed25519 } from '@ucanto/principal'
import "dotenv/config"

const service = ed25519.parse(process.env.SERVICE_ID)
const issuer = ed25519.parse(process.env.CLIENT_KEYPAIR)

// These objects conform to @ucanto/interface types:

// Capability type: { can: string, with: string, nb?: object }
const capability = {
  can: 'store/add',
  with: issuer.did(),
  nb: { link: 'bafybeigwflfnv7tjgpuy52ep45cbbgkkb2makd3bwhbj3ueabvt3eq43ca' }
}

// Invocation type: signed capability with proofs
const invocation = Client.invoke({
  issuer,
  audience: service,
  capability
})

// ConnectionView type: interface for executing invocations
const connection = Client.connect({
  id: service,
  channel: mockChannel, // Channel<Service> type
  codec: mockCodec,     // OutboundCodec type
})

// Receipt type: signed result from service
const [receipt] = await connection.execute(invocation)
console.log('Receipt conforms to interface types:', receipt.out)