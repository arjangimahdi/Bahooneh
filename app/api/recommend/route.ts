import { recommend } from "@/utils/pipe/recommend";
import { RecommendEvent } from "@/utils/pipe/types";
import { wizardSchema } from "@/utils/wizard/schema";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null)
    const payload = wizardSchema.parse(body)
    const timeoutMs = 25_000
    const controller = new AbortController()
    setTimeout(() => { controller.abort(new Error('timeout_reached')) }, timeoutMs)
    request.signal.addEventListener('abort', () => controller.abort(new Error(request.signal.reason)))

    const closed = false
    const encoder = new TextEncoder()
    const stream = new ReadableStream<Uint8Array>({
      async start(sink) {
        const send = (event: RecommendEvent) => {
          if (!closed) sink.enqueue(encoder.encode(JSON.stringify(event) + " \n"))
        }
        send({ type: 'start', timeoutMs })

        for await (const event of recommend(payload, controller.signal)) send(event)
      },
      cancel(resonse) {

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