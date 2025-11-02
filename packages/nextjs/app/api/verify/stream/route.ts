import { NextRequest } from 'next/server'
import { addClient, getLatestVerification } from '@/lib/verifyEvents'

export const runtime = 'nodejs' // ensure Node runtime for streaming

export async function GET(_req: NextRequest) {
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      // Register client and send the latest snapshot
      const remove = addClient(controller)

      // Keep-alive ping every 15s to prevent proxies from closing
      const keepAlive = setInterval(() => {
        try {
          controller.enqueue(new TextEncoder().encode(': keep-alive\n\n'))
        } catch {
          // ignore
        }
      }, 15000)

      // Cleanup on cancel/close
      const cancel = () => {
        clearInterval(keepAlive)
        remove()
        try { controller.close() } catch {}
      }

      // @ts-expect-error - not typed on ReadableStreamDefaultController
      controller.signal?.addEventListener?.('abort', cancel)
    },
    cancel() {
      // no-op; cleanup handled above
    },
  })

  return new Response(stream, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
