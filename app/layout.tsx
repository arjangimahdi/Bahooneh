import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Vazirmatn } from "next/font/google";
import { dir, locale, t } from "@/i18n";
import { Wordmark } from "@/components/Logo";
import "./globals.css";

const vazirmatn = Vazirmatn({
    variable: "--font-vazirmatn",
    subsets: ["arabic", "latin"],
    weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
    title: t("app.name"),
    description: t("app.description"),
};

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    viewportFit: "cover",
    themeColor: [
        { media: "(prefers-color-scheme: light)", color: "#faf3ef" },
        { media: "(prefers-color-scheme: dark)", color: "#17120f" },
    ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang={locale} dir={dir} className={`${vazirmatn.variable} h-full`}>
            <body className="flex min-h-full flex-col">
                <header className="border-b border-line">
                    <div className="mx-auto flex w-full max-w-5xl items-center justify-between p-4">
                        <Link href="/" aria-label={t("app.name")} className="flex">
                            <Wordmark />
                        </Link>
                    </div>
                </header>
                <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>
                <footer className="border-t border-line">
                    <p className="mx-auto max-w-5xl px-4 py-5 text-sm text-muted">{t("app.footer")}</p>
                </footer>
            </body>
        </html>
    );
}
