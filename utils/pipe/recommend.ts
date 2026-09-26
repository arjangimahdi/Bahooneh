import { WizardPayload } from "../wizard/schema";
import { MOCK_ITEMS } from "./mock-products";
import { RecommendEvent } from "./types";

export async function* recommend(payload: WizardPayload, signal: AbortSignal): AsyncGenerator<RecommendEvent> {
  try {
    yield { type: 'stage', stage: 'understanding' }

    await new Promise((resolve) => setTimeout(() => {
      console.log('understanding')
      resolve('understanding')
    }, 7000))
    signal.throwIfAborted()
    
    yield { type: 'stage', stage: 'ideating', categoryCount: 10, recipientLabel: '' }

    await new Promise((resolve) => setTimeout(() => {
      console.log('ideating')
      resolve('ideating')
    }, 10000))
    signal.throwIfAborted()

    yield { type: 'result', items: MOCK_ITEMS, failedPartners: [] }
  } catch (err) {
    // yield error
  }
}