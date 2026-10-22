import { recommend } from "@/utils/pipe/recommend";
import { encodeEvent, isTerminalEvent, RecommendEvent } from "@/utils/pipe/events";
import { wizardSchema } from "@/utils/wizard/schema";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  const parsed = wizardSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_payload', issues: parsed.error.issues }, { status: 400 })
  }

  try {
    const payload = parsed.data
    const timeoutMs = 25_000
    const controller = new AbortController()
    const timer = setTimeout(() => { controller.abort(new Error('timeout_reached')) }, timeoutMs)
    request.signal.addEventListener('abort', () => controller.abort(request.signal.reason))

    let closed = false
    const encoder = new TextEncoder()
    const stream = new ReadableStream<Uint8Array>({
      async start(sink) {
        const send = (event: RecommendEvent) => {
          if (!closed) sink.enqueue(encoder.encode(encodeEvent(event)))
        }
        send({ type: 'start', timeoutMs })

        try {
          for await (const event of recommend(payload, controller.signal)) {
            send(event)
            if (isTerminalEvent(event)) break
          }
        } catch (error) {
          console.error("[api/recommend] stream failed", error);
          send({ type: "error", code: "internal" });
        } finally {
          clearTimeout(timer);
          if (!closed) {
            closed = true
            sink.close();
          }
        }
      },
      cancel() {
        closed = true
        controller.abort(new Error("client disconnected"));
        clearTimeout(timer);
      }
    })

  
    return new Response(stream, {
      headers: {
        "content-type": "application/x-ndjson; charset=utf-8",
        "cache-control": "no-store",
        "x-accel-buffering": "no",
      }
    })
  } catch (error) {
    return NextResponse.json({
      error: 'مشکلی پیش اومده ، لطفا دوباره تلاش کنید'
    }, {
      status: 500
    })
  }
}