import { useEffect, useRef, useState, useCallback } from "react";
import { sfx } from "@/lib/audio";

// Matiks — 4x4 number grid speed math puzzle.
const START_TIME = 30;

const genGrid = () => Array.from({ length: 16 }, () => 1 + Math.floor(Math.random() * 9));

const genTarget = (grid) => {
    // Pick a random subset of 2-4 cells that don't overlap, sum them.
    const picks = new Set();
    const count = 2 + Math.floor(Math.random() * 3);
    while (picks.size < count) picks.add(Math.floor(Math.random() * 16));
    let sum = 0;
    picks.forEach((i) => (sum += grid[i]));
    return sum;
};

const Matiks = ({ onEnd, restartKey }) => {
    const [grid, setGrid] = useState(() => genGrid());
    const [target, setTarget] = useState(0);
    const [selected, setSelected] = useState(new Set());
    const [score, setScore] = useState(0);
    const [time, setTime] = useState(START_TIME);
    const [combo, setCombo] = useState(0);
    const endedRef = useRef(false);

    const currentSum = Array.from(selected).reduce((a, i) => a + grid[i], 0);

    useEffect(() => {
        endedRef.current = false;
        const g = genGrid();
        setGrid(g);
        setTarget(genTarget(g));
        setSelected(new Set());
        setScore(0);
        setTime(START_TIME);
        setCombo(0);
    }, [restartKey]);

    useEffect(() => {
        const iv = setInterval(() => {
            setTime((t) => {
                if (t <= 0.1) return 0;
                return +(t - 0.1).toFixed(1);
            });
        }, 100);
        return () => clearInterval(iv);
    }, [restartKey]);

    useEffect(() => {
        if (time <= 0 && !endedRef.current) {
            endedRef.current = true;
            sfx.fail();
            setTimeout(() => onEnd(score), 400);
        }
        // eslint-disable-next-line
    }, [time]);

    const nextRound = useCallback(() => {
        const g = genGrid();
        setGrid(g);
        setTarget(genTarget(g));
        setSelected(new Set());
    }, []);

    useEffect(() => {
        if (target === 0) return;
        if (currentSum === target && selected.size > 0) {
            const bonus = Math.max(1, 4 - selected.size + 1);
            const gained = 10 + selected.size * 5 + combo * 2;
            const timeBonus = 1.5 + selected.size * 0.3;
            setScore((s) => s + gained);
            setCombo((c) => c + 1);
            setTime((t) => Math.min(60, +(t + timeBonus).toFixed(1)));
            sfx.score();
            setTimeout(nextRound, 200);
        } else if (currentSum > target) {
            sfx.fail();
            setSelected(new Set());
            setCombo(0);
        }
        // eslint-disable-next-line
    }, [currentSum, target]);

    const toggle = (idx) => {
        if (time <= 0) return;
        sfx.click();
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(idx)) next.delete(idx); else next.add(idx);
            return next;
        });
    };

    return (
        <div className="relative w-full h-full flex flex-col items-center justify-center p-4 gap-6">
            {/* HUD */}
            <div className="w-full max-w-md flex items-center justify-between gap-3">
                <div className="px-3 py-1.5 bg-black/70 neon-cyan-border font-mono-hud text-cyan-300 text-xs tracking-widest" data-testid="matiks-score">
                    SCORE <span className="neon-amber-text text-lg ml-2">{score}</span>
                </div>
                <div className={`px-3 py-1.5 bg-black/70 font-mono-hud text-xs tracking-widest ${time < 10 ? "neon-amber-border text-amber-400 blink" : "neon-cyan-border text-cyan-300"}`} data-testid="matiks-time">
                    TIME <span className="text-lg ml-2 text-white">{time.toFixed(1)}s</span>
                </div>
                <div className="px-3 py-1.5 bg-black/70 neon-cyan-border font-mono-hud text-cyan-300 text-xs tracking-widest">
                    x{combo}
                </div>
            </div>

            {/* Target */}
            <div className="text-center">
                <div className="text-xs uppercase tracking-[0.3em] text-slate-400 font-mono-hud">Reach target</div>
                <div className="mt-1 font-display font-black text-6xl neon-cyan-text" data-testid="matiks-target">{target}</div>
                <div className="mt-1 text-xs uppercase tracking-[0.3em] text-slate-500 font-mono-hud">
                    Current: <span className={currentSum === target ? "text-emerald-400" : currentSum > target ? "text-red-400" : "text-amber-400"}>{currentSum}</span>
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-4 gap-3" data-testid="matiks-grid">
                {grid.map((n, i) => {
                    const isSel = selected.has(i);
                    return (
                        <button
                            key={i}
                            data-testid={`matiks-cell-${i}`}
                            onClick={() => toggle(i)}
                            className={`w-16 h-16 sm:w-20 sm:h-20 font-mono-hud font-bold text-2xl sm:text-3xl transition-[transform,box-shadow,background-color,color] duration-150
                                ${isSel ? "bg-cyan-400 text-black neon-cyan-border-active" : "bg-black/70 text-cyan-300 neon-cyan-border hover:-translate-y-[2px]"}`}
                        >
                            {n}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default Matiks;
