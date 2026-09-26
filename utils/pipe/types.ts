export type ErrorCode = "ai_unavailable" | "timeout" | "internal";

export type PartnerId = 'digikala' | 'snapshop' | 'mock'

export interface Product {
  id: number;
  title: string;
  price: number;
  imageUrl: string;
  partner: PartnerId;
  available: boolean;
}

export interface ResultItem {
  product: Product;
  affiliateUrl: string;
  rationale: string;
}

export type StageEvent = Extract<RecommendEvent, { type: 'stage' }>;
export type ResultEvent = Extract<RecommendEvent, { type: 'result' }>;

export type RecommendEvent =
  | { type: "start"; timeoutMs: number }
  | { type: "stage"; stage: "understanding" }
  | { type: "stage"; stage: "ideating"; recipientLabel: string; categoryCount: number }
  | { type: "stage"; stage: "fetching"; partners: PartnerId[] }
  | { type: "stage"; stage: "filtering"; candidateCount: number }
  | { type: "stage"; stage: "assembling" }
  | { type: "partner_failed"; partner: PartnerId }
  | { type: "result"; items: ResultItem[]; failedPartners: PartnerId[] }
  | { type: "error"; code: ErrorCode };