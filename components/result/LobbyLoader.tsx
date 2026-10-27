"use client";

import { useEffect, useState } from "react";

type Props = {
    size?: number;
    tone?: "light" | "dark";
    showMessages?: boolean;
    messages?: string[];
    interval?: number;
    className?: string;
};

const DEFAULT_MESSAGES = [
    "Reading your answers…",
    "Asking our AI…",
    "Searching partner shops…",
    "Picking the best matches…",
];

const COLORS = {
    ink: "#202C39",
    petal: "#FFE8D6",
    tangerine: "#F29559",
    olive: "#6B705C",
};

const TAG =
    "M34 26 H80 Q88 26 88 34 V66 Q88 74 80 74 H34 L14 54 Q10 50 14 46 Z M33 50 A5 5 0 1 0 23 50 A5 5 0 1 0 33 50 Z";
const sparkle = (r: number) =>
    `M0 ${-r} Q${r * 0.1} ${-r * 0.1} ${r} 0 Q${r * 0.1} ${r * 0.1} 0 ${r} Q${-r * 0.1} ${r * 0.1} ${-r} 0 Q${-r * 0.1} ${-r * 0.1} 0 ${-r} Z`;

const CSS = `
.byl-swing{transform-box:view-box;transform-origin:120px 24px;animation:byl-swing 1.6s ease-in-out infinite alternate}
@keyframes byl-swing{from{transform:rotate(-8deg)}to{transform:rotate(8deg)}}
.byl-spark{transform-box:fill-box;transform-origin:center;animation:byl-spark 1.6s ease-in-out infinite}
@keyframes byl-spark{0%,100%{transform:scale(.75) rotate(0deg)}50%{transform:scale(1.1) rotate(45deg)}}
.byl-tw{transform-box:fill-box;transform-origin:center;opacity:0;animation:byl-tw 2.4s ease-in-out infinite}
.byl-tw2{animation-delay:.6s}.byl-tw3{animation-delay:1.2s}.byl-tw4{animation-delay:1.8s}
@keyframes byl-tw{0%,100%{opacity:0;transform:scale(.4)}40%{opacity:1;transform:scale(1)}70%{opacity:0;transform:scale(.6)}}
.byl-shadow{transform-box:fill-box;transform-origin:center;animation:byl-shadow 1.6s ease-in-out infinite alternate}
@keyframes byl-shadow{from{transform:translateX(-14px)}to{transform:translateX(14px)}}
.byl-msg{animation:byl-fade .4s ease-out}
@keyframes byl-fade{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}
@media (prefers-reduced-motion: reduce){
  .byl-swing,.byl-spark,.byl-tw,.byl-shadow,.byl-msg{animation:none}
  .byl-tw{opacity:1}
}
`;

export default function ByadetLoader({
    size = 240,
    tone = "light",
    showMessages = true,
    messages = DEFAULT_MESSAGES,
    interval = 2600,
    className,
}: Props) {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        if (!showMessages || messages.length < 2) return;
        const id = setInterval(() => setIndex((i) => (i + 1) % messages.length), interval);
        return () => clearInterval(id);
    }, [showMessages, messages.length, interval]);

    const line = tone === "dark" ? COLORS.petal : COLORS.ink;
    const small = size < 96;
    const message = messages[index % messages.length];

    return (
        <div
            role="status"
            aria-live="polite"
            className={className}
            style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: 8 }}
        >
            <style>{CSS}</style>
            <svg viewBox="0 0 240 240" width={size} height={size} aria-hidden="true">
                {!small && (
                    <ellipse className="byl-shadow" cx="120" cy="214" rx="34" ry="5" fill={line} opacity="0.12" />
                )}
                <circle cx="120" cy="24" r={small ? 10 : 6} fill={line} />
                <g className="byl-swing">
                    <g transform="translate(120 84) rotate(90) scale(1.6) translate(-28 -50)">
                        <path fillRule="evenodd" fill={COLORS.tangerine} d={TAG} />
                    </g>
                    <path
                        d="M120 28 L120 84"
                        fill="none"
                        stroke={line}
                        strokeWidth={small ? 8 : 3}
                        strokeLinecap="round"
                    />
                    <g transform="translate(120 137)">
                        <path className="byl-spark" fill={COLORS.ink} d={sparkle(16)} />
                    </g>
                </g>
                {!small && (
                    <>
                        <g transform="translate(58 112)">
                            <path className="byl-tw" fill={COLORS.tangerine} d={sparkle(9)} />
                        </g>
                        <g transform="translate(186 88)">
                            <path className="byl-tw byl-tw2" fill={line} d={sparkle(7)} />
                        </g>
                        <g transform="translate(184 172)">
                            <path className="byl-tw byl-tw3" fill={COLORS.tangerine} d={sparkle(8)} />
                        </g>
                        <g transform="translate(62 178)">
                            <path
                                className="byl-tw byl-tw4"
                                fill={tone === "dark" ? COLORS.petal : COLORS.olive}
                                d={sparkle(6)}
                            />
                        </g>
                    </>
                )}
            </svg>
            {showMessages ? (
                <span
                    key={index}
                    className="byl-msg"
                    style={{ fontWeight: 700, fontSize: 18, color: line, fontFamily: "inherit" }}
                >
                    {message}
                </span>
            ) : (
                <span style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>
                    Loading
                </span>
            )}
        </div>
    );
}
