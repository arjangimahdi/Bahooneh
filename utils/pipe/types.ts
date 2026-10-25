export const PARTNER_IDS = ["digikala", "snapshop", "mock"] as const;
export type PartnerId = (typeof PARTNER_IDS)[number];

export interface Product {
    id: string;
    partner: PartnerId;
    title: string;
    imageUrl: string | null;
    price: number;
    url: string;
    available: boolean;
    category?: string;
}

export interface ResultItem {
    product: Product;
    affiliateUrl: string;
    rationale: string;
}
