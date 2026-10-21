import { WizardPayload } from "../wizard/schema";
import { MOCK_ITEMS } from "./mock-products";
import { RecommendEvent } from "./events";

export async function* recommend(payload: WizardPayload, signal: AbortSignal): AsyncGenerator<RecommendEvent> {
  try {
    yield { type: 'stage', stage: 'understanding', recipientLabel: 'friend' }

    await new Promise((resolve) => setTimeout(() => {
      console.log('understanding')
      resolve('understanding')
    }, 7000))
    signal.throwIfAborted()
    
    yield { type: 'stage', stage: 'ideating', categoryCount: 10}

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