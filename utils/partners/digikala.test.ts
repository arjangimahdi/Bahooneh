import { afterEach, describe, expect, it, vi } from "vitest";
import { productSchema } from "../pipe/schema";
import type { Product } from "../pipe/types";
import fixture from "./__fixtures__/digikala-search.json";
import { buildSearchUrl, digikala, extractProducts, toProduct } from "./digikala";
import { PartnerError, type SearchQuery } from "./types";

type RawProduct = Parameters<typeof toProduct>[0];

const raws = extractProducts(fixture);

const organic: RawProduct = {
    id: 4379670,
    title_fa: "  هندزفری سیمی مدل YS  ",
    status: "marketable",
    url: { uri: "/product/dkp-4379670/هندزفری-سیمی-مدل-ys" },
    images: { main: { url: ["https://dkstatics-public.digikala.com/digikala-products/a.jpg"] } },
    rating: { rate: 82.5, count: 120 },
    data_layer: { item_category3: "هدفون، هدست و هندزفری" },
    properties: { is_ad: false },
    default_variant: { price: { selling_price: 1_790_005 } },
};

const listing = (widgets: unknown[]) => ({ type: "vertical_product_listing", data: { widgets } });

describe("extractProducts", () => {
    it("finds every product in the captured response", () => {
        expect(raws).toHaveLength(26);
        expect(raws[0].id).toBe(23018149);
    });

    it("finds the listing by type, not by position", () => {
        const withBanner = {
            data: {
                widgets: [{ type: "banner", data: { widgets: [] } }, listing([{ type: "product", data: organic }])],
            },
        };
        expect(extractProducts(withBanner)).toEqual([organic]);
    });

    it("keeps only product widgets", () => {
        const mixed = {
            data: { widgets: [listing([{ type: "banner", data: {} }, { type: "product", data: organic }, null])] },
        };
        expect(extractProducts(mixed)).toEqual([organic]);
    });

    it.each([
        ["null", null],
        ["an empty object", {}],
        ["data without widgets", { data: {} }],
        ["widgets that are not an array", { data: { widgets: "x" } }],
        ["no listing widget", { data: { widgets: [{ type: "banner" }] } }],
        ["a listing without products", { data: { widgets: [{ type: "vertical_product_listing", data: {} }] } }],
    ])("returns [] for %s", (_, input) => {
        expect(extractProducts(input)).toEqual([]);
    });
});

describe("toProduct", () => {
    it("translates a raw product into our shape", () => {
        expect(toProduct(organic)).toEqual({
            id: "digikala:4379670",
            partner: "digikala",
            title: "هندزفری سیمی مدل YS",
            price: 179_001,
            imageUrl: "https://dkstatics-public.digikala.com/digikala-products/a.jpg",
            url: "https://www.digikala.com/product/dkp-4379670/%D9%87%D9%86%D8%AF%D8%B2%D9%81%D8%B1%DB%8C-%D8%B3%DB%8C%D9%85%DB%8C-%D9%85%D8%AF%D9%84-ys",
            available: true,
            rating: 82.5,
            reviewCount: 120,
            category: "هدفون، هدست و هندزفری",
        });
    });

    it.each<[string, RawProduct]>([
        ["no id", { ...organic, id: undefined }],
        ["a blank title", { ...organic, title_fa: "   " }],
        ["no price", { ...organic, default_variant: {} }],
        ["a zero price", { ...organic, default_variant: { price: { selling_price: 0 } } }],
        [
            "a price that is not a number",
            { ...organic, default_variant: { price: { selling_price: "100" as unknown as number } } },
        ],
        ["an ad", { ...organic, properties: { is_ad: true } }],
    ])("drops a product with %s", (_, raw) => {
        expect(toProduct(raw)).toBeNull();
    });

    it("marks anything not marketable as unavailable", () => {
        expect(toProduct({ ...organic, status: "out_of_stock" })?.available).toBe(false);
        expect(toProduct({ ...organic, status: undefined })?.available).toBe(false);
    });

    it("falls back to the dkp url when uri is missing or points elsewhere", () => {
        const fallback = "https://www.digikala.com/product/dkp-4379670/";
        expect(toProduct({ ...organic, url: undefined })?.url).toBe(fallback);
        expect(toProduct({ ...organic, url: { uri: "https://evil.example/x" } })?.url).toBe(fallback);
    });

    it("strips query strings from the product url", () => {
        expect(toProduct({ ...organic, url: { uri: "/product/dkp-1/?utm_source=x#top" } })?.url).toBe(
            "https://www.digikala.com/product/dkp-1/"
        );
    });

    it("leaves out optional fields that are missing", () => {
        const product = toProduct({
            ...organic,
            images: {},
            rating: { rate: undefined },
            data_layer: { item_category3: "" },
        });
        expect(product?.imageUrl).toBeNull();
        expect(product).not.toHaveProperty("rating");
        expect(product).not.toHaveProperty("reviewCount");
        expect(product).not.toHaveProperty("category");
    });

    it("turns the captured response into valid, ad-free products in toman", () => {
        const products = raws.map(toProduct).filter((p): p is Product => p !== null);
        const ads = raws.filter((raw) => raw.properties?.is_ad).length;
        expect(products).toHaveLength(raws.length - ads);
        for (const product of products) {
            expect(productSchema.safeParse(product).success).toBe(true);
            expect(Number.isInteger(product.price)).toBe(true);
            expect(product.url.startsWith("https://www.digikala.com/product/dkp-")).toBe(true);
        }
    });
});

const query: SearchQuery = { term: "هدفون بی‌سیم", minPrice: 500_000, maxPrice: 3_000_000, limit: 6 };

const fakeFetch = (status: number, body: unknown) => {
    const fake = vi.fn(async () => new Response(JSON.stringify(body), { status }));
    vi.stubGlobal("fetch", fake);
    return fake;
};

afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
});

describe("product links", () => {
    it("point to the website, not the API", () => {
        const product = raws.map(toProduct).find((p) => p?.id === "digikala:4379670");
        expect(product?.url.startsWith("https://www.digikala.com/product/dkp-4379670/")).toBe(true);
        expect(toProduct({ ...organic, url: undefined })?.url).toBe("https://www.digikala.com/product/dkp-4379670/");
    });
});

describe("buildSearchUrl", () => {
    it("builds the search address with the term, sort, page and price in rial", () => {
        vi.stubEnv("DIGIKALA_API_URL", "");
        const url = new URL(buildSearchUrl(query));
        expect(url.host).toBe("api.digikala.com");
        expect(url.pathname).toBe("/discovery/api/v2/search");
        expect(url.searchParams.get("q")).toBe("هدفون بی‌سیم");
        expect(url.searchParams.get("page")).toBe("1");
        expect(url.searchParams.get("sort")).toBe("7");
        expect(url.searchParams.get("price[min]")).toBe("5000000");
        expect(url.searchParams.get("price[max]")).toBe("30000000");
    });

    it("uses DIGIKALA_API_URL when it is set", () => {
        vi.stubEnv("DIGIKALA_API_URL", "http://localhost:4010");
        expect(buildSearchUrl(query).startsWith("http://localhost:4010/discovery/api/v2/search?")).toBe(true);
    });
});

describe("digikala.search", () => {
    it("returns up to limit organic products in toman", async () => {
        const fake = fakeFetch(200, fixture);
        const products = await digikala.search(query, new AbortController().signal);
        expect(products).toHaveLength(query.limit);
        expect(products[0]).toMatchObject({ id: "digikala:4379670", price: 179_000 });
        const adIds = raws.filter((raw) => raw.properties?.is_ad).map((raw) => `digikala:${raw.id}`);
        expect(products.some((p) => adIds.includes(p.id))).toBe(false);
        expect(fake).toHaveBeenCalledWith(
            expect.any(String),
            expect.objectContaining({
                headers: expect.objectContaining({
                    referer: "https://www.digikala.com/search/",
                    origin: "https://www.digikala.com",
                }),
            })
        );
    });

    it("returns [] when the answer has no listing", async () => {
        fakeFetch(200, {});
        expect(await digikala.search(query, new AbortController().signal)).toEqual([]);
    });

    it("rejects with a PartnerError on a 404", async () => {
        fakeFetch(404, {});
        const error = await digikala.search(query, new AbortController().signal).catch((e: unknown) => e);
        expect(error).toBeInstanceOf(PartnerError);
        expect(error).toMatchObject({ status: 404, partner: "digikala" });
    });
});

describe("digikala.affiliateUrl", () => {
    const product = toProduct(organic)!;

    it("returns the product url when no affiliate query is set", () => {
        vi.stubEnv("DIGIKALA_AFFILIATE_QUERY", "");
        expect(digikala.affiliateUrl(product)).toBe(product.url);
    });

    it("adds every affiliate parameter without changing the product", () => {
        vi.stubEnv("DIGIKALA_AFFILIATE_QUERY", "utm_source=byadet&aff=1");
        const original = product.url;
        const url = new URL(digikala.affiliateUrl(product));
        expect(url.searchParams.get("utm_source")).toBe("byadet");
        expect(url.searchParams.get("aff")).toBe("1");
        expect(product.url).toBe(original);
    });

    it("has the digikala id", () => {
        expect(digikala.id).toBe("digikala");
    });
});
