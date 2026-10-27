import { formatToman, t, toPersianDigits } from "@/i18n";
import { PartnerId, ResultItem } from "@/utils/pipe/types";

interface Props {
    items: ResultItem[];
    failedPartners: PartnerId[];
}

export function ProductsView({ items, failedPartners }: Props) {
    if (items.length === 0) {
        return (
            <section className="mx-auto flex w-full max-w-xl flex-col items-center gap-3 py-10 text-center">
                <h1 className="text-2xl font-bold text-ink">{t("results.emptyTitle")}</h1>
                <p className="leading-relaxed text-muted">{t("results.emptyBody")}</p>
            </section>
        );
    }

    return (
        <section className="mx-auto flex w-full max-w-2xl flex-col gap-6 py-10">
            <header className="flex flex-col gap-2">
                <h1 className="text-2xl font-bold text-ink">{t("results.title")}</h1>
                <p className="leading-relaxed text-muted">
                    {t("results.subtitle", { count: toPersianDigits(items.length) })}
                </p>
            </header>
            {failedPartners.length > 0 && (
                <ul className="flex flex-col gap-2">
                    {failedPartners.map((id) => (
                        <li key={id} className="rounded-card bg-warn-soft px-4 py-2 text-sm text-warn">
                            {t("results.partnerFailed", { partner: t(`partners.${id}`) })}
                        </li>
                    ))}
                </ul>
            )}
            <ul className="flex flex-col gap-3">
                {items.map(({ product, affiliateUrl }) => {
                    const partner = t(`partners.${product.partner}`);
                    return (
                        <li
                            key={product.id}
                            className="flex flex-col gap-2 rounded-card border border-line bg-surface p-4"
                        >
                            <h2 className="font-semibold text-ink">{product.title}</h2>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
                                <span className="font-semibold text-ink">
                                    {formatToman(product.price)} {t("common.toman")}
                                </span>
                                <span>{t("results.via", { partner })}</span>
                                {!product.available && <span className="text-warn">{t("results.unavailable")}</span>}
                            </div>
                            <a
                                href={affiliateUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="self-start text-sm font-semibold text-accent"
                            >
                                {t("results.viewOn", { partner })}
                            </a>
                        </li>
                    );
                })}
            </ul>
        </section>
    );
}
