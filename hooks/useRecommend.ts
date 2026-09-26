import { RecommendEvent, ResultItem, StageEvent } from "@/utils/pipe/types";
import { WizardPayload } from "@/utils/wizard/schema";
import { useEffect, useState } from "react";

export function useRecommend (payload: WizardPayload | null) {
  const [results, setResults] = useState<ResultItem[] | null>(null)
  const [stage, setStage] = useState<StageEvent | null>(null)

  useEffect(() => {
    async function hitRecommend() {
      const res = await fetch('/api/recommend', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!res.ok || !res.body) throw new Error(`recommend failed: ${res.status}`);

      const reader = res.body?.pipeThrough(new TextDecoderStream()).getReader()
      
      let buffer = ""
      for (;;) {
        const { value, done } = await reader?.read()
        if (done) break

        buffer += value;
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const event: RecommendEvent = JSON.parse(line)

          if (event.type === 'stage') setStage(event)
          if (event.type === 'result') setResults(event.items)
        }
      }
    }

    hitRecommend()
  }, [payload])

  return { stage, results }
}