import { useEffect, useRef, useState } from "react";
import { sfx } from "@/lib/audio";

// Millisecond Reflex Test — wait for green, tap ASAP.
const ReflexTest = ({ onEnd, restartKey }) => {
    const [phase, setPhase] = useState("idle"); // idle | wait | ready | result | early
    const [ms, setMs] = useState(0);
    const [attempts, setAttempts] = useState([]);
    const startRef = useRef(0);
    const timerRef = useRef(null);

    const startWait = () => {
        clear();
        setPhase("wait");
        const delay = 2000 + Math.random() * 3000;
        timerRef.current = setTimeout(() => {
            startRef.current = performance.now();
            setPhase("ready");
            sfx.flash();
        }, delay);
    };

    const clear = () => {
        if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    };

    useEffect(() => () => clear(), []);
    useEffect(() => { setPhase("idle"); setMs(0); setAttempts([]); clear(); }, [restartKey]);

    const handleClick = () => {
        if (phase === "idle" || phase === "result" || phase === "early") {
            startWait();
        } else if (phase === "wait") {
            clear();
            setPhase("early");
            sfx.fail();
        } else if (phase === "ready") {
            const elapsed = Math.round(performance.now() - startRef.current);
            setMs(elapsed);
            setPhase("result");
            sfx.score();
            const next = [...attempts, elapsed].slice(-5);
            setAttempts(next);
        }
    };

    const tier = (t) => {
        if (t < 200) return { label: "Gamer Reflexes", color: "text-emerald-400" };
        if (t <= 250) return { label: "Above Average", color: "text-cyan-300" };
        if (t <= 300) return { label: "Average", color: "text-amber-400" };
        return { label: "Slow", color: "text-red-400" };
    };

    const bg = phase === "wait" ? "bg-red-600" : phase === "ready" ? "bg-emerald-500" : phase === "early" ? "bg-red-800" : "bg-[#090D16]";

    const submit = () => onEnd(ms);

    return (
        <div className={`relative w-full h-full flex items-center justify-center transition-colors duration-100 ${bg}`} onClick={handleClick} data-testid="reflex-surface">
            <div className="text-center px-6 no-select pointer-events-none">
                {phase === "idle" && (
                    <>
                        <div className="font-display font-black text-4xl sm:text-5xl neon-cyan-text mb-4">Reflex Test</div>
                        <div className="font-mono-hud text-sm text-slate-300 tracking-widest uppercase">Click / Tap anywhere to begin</div>
                    </>
                )}
                {phase === "wait" && (
                    <>
                        <div className="font-display font-black text-4xl sm:text-6xl text-white">Wait for Green...</div>
                        <div className="font-mono-hud text-sm text-red-100 mt-4 tracking-widest uppercase blink">Do not tap yet</div>
                    </>
                )}
                {phase === "ready" && (
                    <div className="font-display font-black text-5xl sm:text-7xl text-white">TAP NOW!</div>
                )}
                {phase === "early" && (
                    <>
                        <div className="font-display font-black text-4xl text-white">Too Early!</div>
                        <div className="font-mono-hud text-sm text-red-100 mt-3 tracking-widest uppercase">Click to try again</div>
                    </>
                )}
                {phase === "result" && (
                    <>
                        <div className={`font-mono-hud text-7xl sm:text-8xl font-black ${tier(ms).color}`} data-testid="reflex-ms">{ms}<span className="text-3xl ml-2">ms</span></div>
                        <div className={`font-display font-bold text-xl sm:text-2xl mt-2 ${tier(ms).color}`}>{tier(ms).label}</div>
                        <div className="font-mono-hud text-xs text-slate-400 mt-4 tracking-widest uppercase">Last 5: {attempts.join(" · ")} ms</div>
                        <div className="font-mono-hud text-xs text-slate-300 mt-6 tracking-widest uppercase">Click to try again</div>
                    </>
                )}
            </div>

            {phase === "result" && (
                <button
                    onClick={(e) => { e.stopPropagation(); submit(); }}
                    className="btn-primary absolute bottom-6 right-6 pointer-events-auto"
                    data-testid="reflex-submit-btn"
                >Submit Score</button>
            )}
        </div>
    );
};

export default ReflexTest;
