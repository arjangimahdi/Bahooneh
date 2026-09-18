import Link from "next/link";
import { t, toPersianDigits } from "@/i18n";
import { LogoMark } from "@/components/Logo";

const HOW_IT_WORKS = ["app.steps.one", "app.steps.two", "app.steps.three"] as const;

export default function HomePage() {
    return (
        <div className="anim-rise flex flex-col gap-14 py-6">
            <section className="flex flex-col items-start gap-6">
                <LogoMark className="h-16 w-16 text-accent" />
                <h1 className="max-w-2xl text-4xl font-bold leading-tight sm:text-5xl">{t("app.tagline")}</h1>
                <p className="max-w-xl text-lg leading-relaxed text-muted">{t("app.description")}</p>
                <Link
                    href="/wizard"
                    className="rounded-full bg-accent px-7 py-3 text-lg font-semibold text-accent-ink shadow-sm transition hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                    {t("app.cta")}
                </Link>
            </section>

            <section className="flex flex-col gap-5">
                <h2 className="text-xl font-semibold">{t("app.howItWorks")}</h2>
                <ol className="grid gap-4 sm:grid-cols-3">
                    {HOW_IT_WORKS.map((key, i) => (
                        <li key={key} className="rounded-card border border-line bg-surface p-5">
                            <span className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-accent-soft text-sm font-bold text-accent">
                                {toPersianDigits(i + 1)}
                            </span>
                            <p className="leading-relaxed text-ink">{t(key)}</p>
                        </li>
                    ))}
                </ol>
            </section>
        </div>
    );
}
