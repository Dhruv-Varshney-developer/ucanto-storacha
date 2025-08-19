import * as Client from '@ucanto/client'
import * as HTTP from '@ucanto/transport/http'
import { CAR } from '@ucanto/transport'
import { ed25519 } from '@ucanto/principal'
import { Receipt, Message } from '@ucanto/core'
import 'dotenv/config'

// Parse your keys from env vars
const service = ed25519.parse(process.env.SERVICE_ID)
const issuer = ed25519.parse(process.env.CLIENT_KEYPAIR)

// Mock fetch that simulates a UCAN service
const mockFetch = async (url, input) => {
  const { invocations } = await CAR.request.decode(input)

  const receipts = await Promise.all(
    invocations.map(inv => Receipt.issue({
      ran: inv.cid,                      // Link to the invocation
      issuer: service,                   // Service signs the receipt
      result: { ok: { status: 'success' } } // Fake success
    }))
  )

  const message = await Message.build({ receipts })
  const response = await CAR.response.encode(message)

  return {
    ok: true,
    headers: new Map(Object.entries(response.headers)),
    arrayBuffer: () => response.body,
  }
}

// Connect to mock service
const connection = Client.connect({
  id: service,
  channel: HTTP.open({ url: new URL('about:blank'), fetch: mockFetch }),
  codec: CAR.outbound,
})

// Create and execute invocation
const invocation = Client.invoke({
  issuer,
  audience: service,
  capability: {
    can: 'store/add',
    with: issuer.did(),
    nb: { link: 'bafybeigwflfnv7tjgpuy52ep45cbbgkkb2makd3bwhbj3ueabvt3eq43ca' }
  }
})

const [receipt] = await connection.execute(invocation)
// A receipt is a signed result from the service proving the invocation was processed
console.log(receipt.out.error ? 'Failed:' : 'Success:', receipt.out)
