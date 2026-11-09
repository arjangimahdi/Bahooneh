"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { LogoMark } from "@/components/Logo";
import { formatToman, t, toPersianDigits } from "@/i18n";
import type { PartnerId, ResultItem } from "@/utils/pipe/types";
import { WIZARD_STEPS } from "@/utils/wizard/options";
import { useWizardStore } from "@/utils/wizard/store";
import type { WizardStepId } from "@/utils/wizard/types";

const FEW_RESULTS = 3;

interface Props {
    items: ResultItem[];
    failedPartners: PartnerId[];
}

function WizardLink({
    step,
    primary = false,
    children,
}: {
    step: WizardStepId;
    primary?: boolean;
    children: ReactNode;
}) {
    const setStep = useWizardStore((s) => s.setStep);
    const tone = primary ? "border-accent bg-accent text-accent-ink" : "border-line bg-surface text-ink";

    return (
        <Link
            href="/wizard"
            onClick={() => setStep(WIZARD_STEPS.indexOf(step))}
            className={`inline-flex items-center justify-center rounded-full border px-6 py-2.5 font-semibold transition hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${tone}`}
        >
            {children}
        </Link>
    );
}

function PartnerNotices({ failedPartners }: { failedPartners: PartnerId[] }) {
    if (failedPartners.length === 0) return null;

    return (
        <ul className="flex flex-col gap-2">
            {failedPartners.map((id) => (
                <li key={id} role="status" className="rounded-card bg-warn-soft px-4 py-2 text-sm text-warn">
                    {t("results.partnerFailed", { partner: t(`partners.${id}`) })}
                </li>
            ))}
        </ul>
    );
}

function ProductCard({ item: { product, affiliateUrl, rationale } }: { item: ResultItem }) {
    const partner = t(`partners.${product.partner}`);

    return (
        <li className="flex gap-4 rounded-card border border-line bg-surface p-4">
            <div className="flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-card bg-paper sm:size-28">
                {product.imageUrl ? (
                    <Image
                        src={product.imageUrl}
                        alt={t("a11y.productImage", { title: product.title })}
                        width={112}
                        height={112}
                        unoptimized
                        className="size-full object-contain"
                    />
                ) : (
                    <LogoMark className="size-10 text-accent" />
                )}
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-3">
                <div className="flex flex-col gap-1">
                    <h2 className="line-clamp-2 font-semibold leading-relaxed text-ink">{product.title}</h2>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
                        <span className="text-base font-bold text-ink">
                            {formatToman(product.price)} {t("common.toman")}
                        </span>
                        <span>{t("results.via", { partner })}</span>
                        {!product.available && <span className="text-warn">{t("results.unavailable")}</span>}
                    </div>
                </div>

                {rationale !== "" && (
                    <div className="flex flex-col gap-1 rounded-card bg-accent-soft/50 px-3 py-2">
                        <span className="text-xs font-semibold text-ink">{t("results.why")}</span>
                        <p className="text-sm leading-relaxed text-ink">{rationale}</p>
                    </div>
                )}

                <a
                    href={affiliateUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="self-start rounded-full bg-accent px-5 py-2 text-sm font-semibold text-accent-ink shadow-sm transition hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                >
                    {t("results.viewOn", { partner })}
                </a>
            </div>
        </li>
    );
}

export function ProductsView({ items, failedPartners }: Props) {
    if (items.length === 0) {
        return (
            <section className="anim-rise mx-auto flex w-full max-w-xl flex-col items-center gap-5 py-10 text-center">
                <LogoMark className="h-14 w-14 text-accent" />
                <h1 className="text-2xl font-bold text-ink">{t("results.emptyTitle")}</h1>
                <p className="leading-relaxed text-muted">{t("results.emptyBody")}</p>
                <PartnerNotices failedPartners={failedPartners} />
                <div className="flex flex-wrap justify-center gap-2">
                    <WizardLink step="budget" primary>
                        {t("results.relaxBudget")}
                    </WizardLink>
                    <WizardLink step="antiPrefs">{t("results.editAntiPrefs")}</WizardLink>
                </div>
            </section>
        );
    }

    return (
        <section className="anim-rise mx-auto flex w-full max-w-2xl flex-col gap-6 py-10">
            <header className="flex flex-col gap-2">
                <h1 className="text-2xl font-bold text-ink">{t("results.title")}</h1>
                <p className="leading-relaxed text-muted">
                    {t("results.subtitle", { count: toPersianDigits(items.length) })}
                </p>
            </header>

            <PartnerNotices failedPartners={failedPartners} />

            {items.length < FEW_RESULTS && (
                <p role="status" className="rounded-card bg-accent-soft/50 px-4 py-2 text-sm leading-relaxed text-ink">
                    {t("results.partial")}
                </p>
            )}

            <ul className="flex flex-col gap-3">
                {items.map((item) => (
                    <ProductCard key={item.product.id} item={item} />
                ))}
            </ul>

            <div className="flex justify-center">
                <WizardLink step="target">{t("common.refine")}</WizardLink>
            </div>
        </section>
    );
}
