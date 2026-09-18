import { t } from "@/i18n";

export function LogoMark({ className = "h-8 w-8" }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 100 100" role="img" aria-label={t("a11y.logo")}>
            <defs>
                <clipPath id="bahane-knot">
                    <path
                        clipRule="evenodd"
                        d="M-150,-150h400v400h-400Z M41.83,50a8.17,8.17 0 1,0 16.34,0a8.17,8.17 0 1,0 -16.34,0Z"
                    />
                </clipPath>
            </defs>
            <g clipPath="url(#bahane-knot)" fill="none" stroke="currentColor" strokeWidth="6.8" strokeLinejoin="round">
                <path d="M52.39,42.64C42.86,34.12 46.23,12.61 59.20,15.01C71.51,17.20 66.97,35.62 52.39,42.64Z" />
                <path d="M57.74,50.00C62.90,38.30 84.40,34.86 86.12,47.94C87.84,60.32 68.92,61.70 57.74,50.00Z" />
                <path d="M52.39,57.36C65.11,58.65 75.03,78.04 63.12,83.71C51.88,89.18 44.72,71.61 52.39,57.36Z" />
                <path d="M43.74,54.55C46.44,67.04 31.07,82.47 21.99,72.90C13.32,63.89 27.82,51.66 43.74,54.55Z" />
                <path d="M43.74,45.45C32.69,51.88 13.27,42.03 19.57,30.44C25.45,19.41 41.57,29.42 43.74,45.45Z" />
            </g>
            <circle cx="50" cy="50" r="5.16" fill="currentColor" />
        </svg>
    );
}

export function Wordmark() {
    return (
        <span className="inline-flex items-center gap-2 text-ink">
            <LogoMark className="h-7 w-7 text-accent" />
            <span className="text-xl font-bold">{t("app.name")}</span>
        </span>
    );
}
