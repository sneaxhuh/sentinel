// Simple in-memory SSE broadcaster for verification updates
// Not for production: does not persist, per-process only

export type VerificationUpdate = {
  nullifier: string | null
  userIdentifier: string | null
  timestamp?: string
}

const encoder = new TextEncoder()

let latest: VerificationUpdate = { nullifier: null, userIdentifier: null }
const clients = new Set<ReadableStreamDefaultController<Uint8Array>>()

function formatEvent(data: unknown): Uint8Array {
  const payload = `data: ${JSON.stringify(data)}\n\n`
  return encoder.encode(payload)
}

export function publishVerificationUpdate(update: VerificationUpdate) {
  latest = update
  const chunk = formatEvent(update)
  for (const client of clients) {
    try {
      client.enqueue(chunk)
    } catch {
      // ignore broken pipes
    }
  }
}

export function getLatestVerification(): VerificationUpdate {
  return latest
}

export function addClient(controller: ReadableStreamDefaultController<Uint8Array>) {
  clients.add(controller)
  // Send the latest snapshot immediately
  controller.enqueue(formatEvent(latest))
  return () => {
    clients.delete(controller)
  }
}
