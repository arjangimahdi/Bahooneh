import type { Product } from "../pipe/types";
import { BROWSER_HEADERS, partnerFetchJson } from "./http";
import type { PartnerAdapter, SearchQuery } from "./types";

const DEFAULT_API_URL = "https://api.digikala.com";
const SITE_URL = "https://www.digikala.com";
const SITE_HOST = new URL(SITE_URL).host;
const RIAL_PER_TOMAN = 10;

const DIGIKALA_HEADERS = {
    ...BROWSER_HEADERS,
    referer: "https://www.digikala.com/search/",
    origin: "https://www.digikala.com",
};

interface RawProduct {
    id?: number;
    title_fa?: string;
    status?: string;
    url?: { uri?: string };
    images?: { main?: { url?: string[] } };
    rating?: { rate?: number; count?: number };
    data_layer?: { item_category3?: string };
    properties?: { is_ad?: boolean };
    default_variant?: { price?: { selling_price?: number } };
}

interface RawProductWidget {
    type?: "product";
    data?: RawProduct;
}

interface RawSearchListing {
    type?: "vertical_product_listing";
    data?: { widgets?: RawProductWidget[] };
}

interface RawSearchBody {
    data?: { widgets?: RawSearchListing[] };
}

const isObject = (value: unknown): value is object => typeof value === "object" && value !== null;

const isNumber = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);

const notNull = <T>(value: T | null): value is T => value !== null;

const nonEmpty = (value: unknown): string | undefined =>
    typeof value === "string" && value.trim() !== "" ? value.trim() : undefined;

const productUrl = (id: number, uri: unknown): string => {
    const path = nonEmpty(uri);
    if (path) {
        try {
            const url = new URL(path, SITE_URL);
            if (url.host === SITE_HOST) {
                url.search = "";
                url.hash = "";
                return url.href;
            }
        } catch {}
    }
    return `${SITE_URL}/product/dkp-${id}/`;
};

export function extractProducts(body: unknown): RawProduct[] {
    if (!isObject(body)) return [];

    const widgets = (body as RawSearchBody).data?.widgets;
    if (!Array.isArray(widgets)) return [];

    const listing = widgets.find((widget) => widget?.type === "vertical_product_listing");
    const items = listing?.data?.widgets;
    if (!Array.isArray(items)) return [];

    return items.flatMap((item) =>
        item?.type === "product" && item.data && typeof item.data === "object" ? [item.data] : []
    );
}

export function toProduct(raw: RawProduct): Product | null {
    const id = raw.id;
    const title = nonEmpty(raw.title_fa);
    const rialPrice = raw.default_variant?.price?.selling_price;
    if (!isNumber(id) || !title || !isNumber(rialPrice) || raw.properties?.is_ad === true) return null;

    const price = Math.round(rialPrice / RIAL_PER_TOMAN);
    if (price <= 0) return null;

    const image = raw.images?.main?.url?.[0];
    const rating = raw.rating?.rate;
    const reviewCount = raw.rating?.count;
    const category = nonEmpty(raw.data_layer?.item_category3);

    return {
        id: `digikala:${id}`,
        partner: "digikala",
        title,
        price,
        imageUrl: nonEmpty(image) ?? null,
        url: productUrl(id, raw.url?.uri),
        available: raw.status === "marketable",
        ...(isNumber(rating) && { rating }),
        ...(isNumber(reviewCount) && { reviewCount }),
        ...(category && { category }),
    };
}

export function buildSearchUrl(query: SearchQuery): string {
    const url = new URL("/discovery/api/v2/search", process.env.DIGIKALA_API_URL || DEFAULT_API_URL);

    url.searchParams.set("q", query.term);
    url.searchParams.set("page", "1");
    url.searchParams.set("sort", "7");
    url.searchParams.set("price[min]", String(query.minPrice * RIAL_PER_TOMAN));
    url.searchParams.set("price[max]", String(query.maxPrice * RIAL_PER_TOMAN));

    return url.href;
}

async function search(query: SearchQuery, signal: AbortSignal): Promise<Product[]> {
    const body = await partnerFetchJson("digikala", buildSearchUrl(query), { signal, headers: DIGIKALA_HEADERS });
    return extractProducts(body).map(toProduct).filter(notNull).slice(0, query.limit);
}

function affiliateUrl(product: Product): string {
    const query = process.env.DIGIKALA_AFFILIATE_QUERY?.trim();
    if (!query) return product.url;

    const url = new URL(product.url);
    for (const [key, value] of new URLSearchParams(query)) url.searchParams.set(key, value);
    return url.href;
}

export const digikala: PartnerAdapter = { id: "digikala", search, affiliateUrl };
