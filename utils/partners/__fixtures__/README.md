# Digikala search API notes

Captured on 2026-10-29 with 9 requests (1.5 s apart, browser-like headers, no cookies). Search term for every test: `هدفون بی‌سیم`.

`digikala-search.json` is the raw, untouched body of:

```
GET https://api.digikala.com/discovery/api/v2/search?page=1&sort=7&q=هدفون%20بی‌سیم
```

## Endpoint and query string

- Endpoint: `https://api.digikala.com/discovery/api/v2/search`
- Minimal working query: `?q=<term>&page=<n>`. Add `sort=7` for best sellers.
- `_rch` is **not needed**. Without it, and with a random `_rch=123abc`, the response is the same (status 200, same size, same product ids in the same order).
- `columns_per_page` is **not needed** and changed nothing.

| Test | Query | Status | Content type | Size | JSON | Top-level keys |
| --- | --- | --- | --- | --- | --- | --- |
| A | `_rch=db340a7f7c4f&columns_per_page=3&page=1&q=…` | 200 | `application/json; charset=utf-8` | 299,263 B | yes | `data`, `status` |
| B | `page=1&q=…` | 200 | same | 299,263 B | yes | `data`, `status` |
| C | `_rch=123abc&columns_per_page=3&page=1&q=…` | 200 | same | 299,263 B | yes | `data`, `status` |

`data` has `widgets` and `event_data`. The three bodies differ byte for byte (tracking ids) but list the same products.

## Sort

- `sort=7` best sellers (also the default; `sort.default` is 7)
- `sort=4` most viewed

The response lists all options in `data.widgets[0].data.sort_options`: 22 most relevant, 4 most viewed, 1 newest, 7 best sellers, 20 cheapest, 21 most expensive, 25 fastest shipping, 27 buyers' choice, 29 featured.

## Filters and paging

| Parameter | Works? | What changed |
| --- | --- | --- |
| `price[min]=5000000&price[max]=30000000` (plain brackets) | **yes** | `total_items` 915 → 847; `filters.price.options` became 2,910,000–85,000,000; every organic product was inside the range. Sponsored products ignore it (three ads at 34M–49.4M stayed). |
| `has_selling_stock=1` | **no** | Same products and same total. With the price filter it still returned an `out_of_stock` product. |
| `page=2` | **yes** | `pager.current_page` 2, different organic products. The same sponsored products are injected again on every page. |

I did not try `price%5Bmin%5D` or `min_price`/`max_price`, because the plain bracket form already worked.

There is no working in-stock parameter, so filter in code: keep products where `status === "marketable"`. Out-of-stock products have `status: "out_of_stock"`.

Paging info is in `data.widgets[0].data.pager`: `{ current_page, total_items, total_pages, total_slots }`. Page 1 had 26 items, page 2 had 25.

## Price unit: rial

Prices look like **rial** (divide by 10 for toman), but I **could not confirm it on the product page**. `https://www.digikala.com/product/dkp-4379670/` returns a 14 KB HTML shell that renders the price with JavaScript, so the price is not in the HTML.

Evidence for rial: that product is a wired hands-free with `selling_price: 1790000`. That is a normal price as 179,000 toman but far too high as 1,790,000 toman. Price filter values (`filters.price.options`) and `price[min]`/`price[max]` use the same unit.

## Where the products are

Product list path: `data.widgets[0].data.widgets[]`

- `data.widgets[0]` is the wrapper (`type: "vertical_product_listing"`). Its `data` also holds `filters`, `pager`, `sort`, `sort_options`, `total_hits` and `advertisement`.
- Each item is `{ type: "product", data, event_data, size }`. The product is in `item.data`.

## Product fields

Paths are relative to one item, `p = data.widgets[0].data.widgets[i].data`. Examples are from item 0 of the sample.

| Field | Path | Example |
| --- | --- | --- |
| id | `p.id` | `23018149` |
| Persian title | `p.title_fa` | `"هدفون بلوتوثی موزیک آپولو مدل RAY--40"` |
| Link (relative) | `p.url.uri` | `"/product/dkp-23018149/هدفون-بلوتوثی-موزیک-آپولو-مدل-ray-40"`, prefix `https://www.digikala.com` |
| Variant id | `p.url.params[0].variant_id` / `p.default_variant.id` | `85106084` |
| Main image | `p.images.main.url[0]` (also `p.images.main.webp_url[0]`) | `https://dkstatics-public.digikala.com/digikala-products/...jpg?...` |
| Selling price (rial) | `p.default_variant.price.selling_price` | `24000000` |
| Original price (rial) | `p.default_variant.price.rrp_price` | `240000000` |
| Discount % | `p.default_variant.price.discount_percent` (only present when discounted) | `90` |
| Special-deal flags | `p.default_variant.price.is_incredible`, `is_promotion`, `timer` | `true`, `true`, `12040` |
| Rating | `p.rating.rate` (0–100) and `p.rating.count` | `100`, `9` |
| Availability | `p.status` (and `p.default_variant.status`) | `"marketable"` / `"out_of_stock"` |
| Stock count | `p.default_variant.marketable_stock` | `201` |
| Category | `p.data_layer.category`, `p.data_layer.item_category2`…`5` | `"[AC,هدفون و هندزفری]"`, `"کالای دیجیتال"`, `"هدفون، هدست و هندزفری"` |
| Brand | `p.data_layer.brand` | `"موزیک آپولو"` |
| Sponsored / ad | `p.properties.is_ad` (details in `p.properties.ad`) | `true` |

In this sample, items 0, 1, 4, 8, 20 and 21 are ads.

## Duplicates

- **Within one page:** no repeated `id` in this sample (26 unique). The older hand-made sample did have repeats; those were sponsored copies of products that also appear organically, so dedupe by `id` anyway.
- **Across pages:** yes. Page 2 repeated five page-1 ids, and all five are ads (`is_ad: true`). Digikala injects the same ads into every page.

## Rate limits and protection

- No 403, 429 or challenge page in 9 requests.
- No `retry-after`, `x-ratelimit-*`, `cf-*` or `ar-*` headers.
- `server: DigiCDN Edge` on every response, plus `x-dk-request-id`, `x-edge-server`, `server-timing`. The API also sends `set-cookie`, which we ignore.
