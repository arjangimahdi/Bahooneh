import { PartnerId, Product } from "../pipe/types";

export interface SearchQuery {
    term: string;
    minPrice: number;
    maxPrice: number;
    limit: number;
}

export interface PartnerAdapter {
    id: PartnerId;
    affiliateUrl(product: Product): string;
    search: (query: SearchQuery, signal: AbortSignal) => Promise<Product[]>;
}

export class PartnerError extends Error {
    constructor(
        message: string,
        readonly partner: PartnerId,
        readonly status?: number,
        readonly cause?: unknown
    ) {
        super(message);
        this.name = "PartnerError";
    }
}
