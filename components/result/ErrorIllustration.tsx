export function ErrorIllustration({ className = "h-auto w-96" }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 320 240" aria-hidden focusable="false">
            <ellipse cx="160" cy="128" rx="128" ry="96" fill="var(--highlight)" opacity="0.45" />
            <ellipse cx="168" cy="222" rx="52" ry="6" fill="var(--ink)" opacity="0.12" />
            <circle cx="160" cy="30" r="6" fill="var(--ink)" />
            <path
                d="M160 34 C157 46 166 56 158 70"
                fill="none"
                stroke="var(--ink)"
                strokeWidth="3"
                strokeLinecap="round"
            />
            <path
                d="M158 70 l-6 3 M158 70 l0 7 M158 70 l6 2"
                fill="none"
                stroke="var(--ink)"
                strokeWidth="2.5"
                strokeLinecap="round"
            />
            <g transform="translate(160 150) rotate(70) scale(1.6) translate(-50 -50)">
                <path
                    fillRule="evenodd"
                    fill="var(--accent)"
                    d="M34 26 H80 Q88 26 88 34 V66 Q88 74 80 74 H34 L14 54 Q10 50 14 46 Z M33 50 A5 5 0 1 0 23 50 A5 5 0 1 0 33 50 Z"
                />
                <path
                    fill="none"
                    stroke="var(--accent-ink)"
                    strokeWidth="1.4"
                    strokeDasharray="2.5 2.5"
                    strokeLinejoin="round"
                    d="M61 35 Q63 48 76 50 Q63 52 61 65 Q59 52 46 50 Q59 48 61 35 Z"
                />
            </g>
            <path
                d="M148 117 C151 105 144 98 150 88"
                fill="none"
                stroke="var(--ink)"
                strokeWidth="3"
                strokeLinecap="round"
            />
            <path
                d="M150 88 l-6 -3 M150 88 l1 -7 M150 88 l6 -2"
                fill="none"
                stroke="var(--ink)"
                strokeWidth="2.5"
                strokeLinecap="round"
            />
            <g transform="translate(232 78)">
                <path
                    fill="var(--secondary)"
                    d="M0 -22 Q-2 -2 -22 0 Q-2 2 0 22 Z"
                    transform="translate(-4 2) rotate(-12)"
                />
                <path
                    fill="var(--secondary)"
                    d="M0 -22 Q2 -2 22 0 Q2 2 0 22 Z"
                    transform="translate(5 -3) rotate(14)"
                />
            </g>
            <circle cx="206" cy="114" r="3.5" fill="var(--accent)" />
            <circle cx="258" cy="110" r="2.5" fill="var(--secondary)" />
            <circle cx="200" cy="60" r="2.5" fill="var(--ink)" />
            <circle cx="268" cy="62" r="3" fill="var(--blossom)" />
        </svg>
    );
}
