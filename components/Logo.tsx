import { t } from "@/i18n";

export function LogoMark({ className = "h-8 w-8 text-accent" }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 100 100" role="img" aria-label={t("a11y.logo")}>
            <g transform="translate(-4 3) rotate(-20 50 50)">
                <path
                    fill="currentColor"
                    fillRule="evenodd"
                    d="M27,27H83Q90,27 90,34V66Q90,73 83,73H27L11.5,53Q9.5,50 11.5,47Z M19.5,50a4.5,4.5 0 1,0 9,0a4.5,4.5 0 1,0 -9,0Z"
                />
                <path fill="var(--accent-ink)" d="M57,35Q59,48 72,50Q59,52 57,65Q55,52 42,50Q55,48 57,35Z" />
            </g>
        </svg>
    );
}

export function Wordmark() {
    return (
        <span className="inline-flex items-center gap-2 text-ink">
            <LogoMark className="h-8 w-8 text-accent" />
            <span className="text-xl font-bold">{t("app.name")}</span>
        </span>
    );
}
