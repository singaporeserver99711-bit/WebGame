import { useEffect, useMemo, useState } from "react";
import { Toaster } from "sonner";
import TopBar from "@/components/TopBar";
import TryAgainModal from "@/components/TryAgainModal";
import Leaderboard from "@/components/Leaderboard";
import DontTouchRed from "@/games/DontTouchRed";
import TowerBloxx from "@/games/TowerBloxx";
import Matiks from "@/games/Matiks";
import ReflexTest from "@/games/ReflexTest";
import { setMuted as setAudioMuted, startMusic, stopMusic } from "@/lib/audio";
import { getBests, setBest, getMuted, setMutedLS, getMusicOn, setMusicOnLS } from "@/lib/storage";

// Reflex: lower ms = better. We store leaderboard `score` as (1_000_000 - ms) so higher-is-better sort works globally.
// Personal best for reflex we invert similarly (store as inverted so setBest logic still works).

const GAMES = [
    {
        id: "dontTouchRed",
        title: "Don't Touch Red",
        scoreLabel: "Time Survived",
        formatDisplay: (v) => `${v.toFixed(2)}s`,
        formatBest: (v) => `${Number(v).toFixed(1)}s`,
        toGlobal: (v) => ({ score: v, display: `${v.toFixed(2)}s` }),
    },
    {
        id: "towerBloxx",
        title: "Tower Bloxx",
        scoreLabel: "Blocks Stacked",
        formatDisplay: (v) => `${v}`,
        formatBest: (v) => `${v}`,
        toGlobal: (v) => ({ score: v, display: `${v} pts` }),
    },
    {
        id: "matiks",
        title: "Matiks",
        scoreLabel: "Points",
        formatDisplay: (v) => `${v}`,
        formatBest: (v) => `${v}`,
        toGlobal: (v) => ({ score: v, display: `${v} pts` }),
    },
    {
        id: "reflex",
        title: "Reflex Test",
        scoreLabel: "Reaction Time",
        formatDisplay: (v) => `${v}ms`,
        formatBest: (v) => `${1000000 - Number(v)}ms`, // stored inverted
        toGlobal: (v) => ({ score: 1000000 - v, display: `${v}ms` }),
    },
];

const Arcade = () => {
    const [active, setActive] = useState("dontTouchRed");
    const [restartKey, setRestartKey] = useState(0);
    const [modalOpen, setModalOpen] = useState(false);
    const [lastResult, setLastResult] = useState(null); // { raw, isNewBest }
    const [bests, setBests] = useState(getBests());
    const [muted, setMuted] = useState(getMuted());
    const [musicOn, setMusicOn] = useState(getMusicOn());
    const [leaderboardTick, setLeaderboardTick] = useState(0);

    const currentGame = useMemo(() => GAMES.find((g) => g.id === active), [active]);

    // Sync audio on mount + on change
    useEffect(() => {
        setAudioMuted(muted);
        setMutedLS(muted);
    }, [muted]);

    useEffect(() => {
        setMusicOnLS(musicOn);
        if (musicOn && !muted) startMusic();
        else stopMusic();
    }, [musicOn, muted]);

    // Personal Best format for TopBar (reflex needs inversion)
    const bestsForTopBar = useMemo(() => {
        const out = {};
        for (const g of GAMES) {
            const v = bests[g.id];
            if (v == null) continue;
            if (g.id === "reflex") {
                out[g.id] = 1000000 - Number(v); // display as ms
            } else {
                out[g.id] = v;
            }
        }
        return out;
    }, [bests]);

    const handleEnd = (raw) => {
        // Convert per-game to a stored score (higher-is-better)
        let stored = raw;
        if (currentGame.id === "reflex") stored = 1000000 - raw;
        const isNewBest = setBest(currentGame.id, stored);
        setBests(getBests());
        setLastResult({ raw, isNewBest });
        setModalOpen(true);
    };

    const handleRetry = () => {
        setModalOpen(false);
        setRestartKey((k) => k + 1);
        setLeaderboardTick((t) => t + 1);
    };

    const handleClose = () => {
        setModalOpen(false);
        setLeaderboardTick((t) => t + 1);
    };

    const topBarGames = GAMES.map((g) => ({
        id: g.id,
        title: g.title,
        formatBest: g.id === "reflex" ? (v) => `${v}ms` : g.formatBest,
    }));

    const renderGame = () => {
        const key = `${active}-${restartKey}`;
        if (active === "dontTouchRed") return <DontTouchRed key={key} onEnd={handleEnd} restartKey={restartKey} />;
        if (active === "towerBloxx") return <TowerBloxx key={key} onEnd={handleEnd} restartKey={restartKey} />;
        if (active === "matiks") return <Matiks key={key} onEnd={handleEnd} restartKey={restartKey} />;
        if (active === "reflex") return <ReflexTest key={key} onEnd={handleEnd} restartKey={restartKey} />;
        return null;
    };

    const modalScore = lastResult
        ? { value: currentGame.toGlobal(lastResult.raw).score, display: currentGame.formatDisplay(lastResult.raw) }
        : { value: 0, display: "0" };

    return (
        <div className="retro-grid relative min-h-screen">
            <Toaster
                position="top-center"
                toastOptions={{
                    style: {
                        background: "#0D0D1A",
                        color: "#06B6D4",
                        border: "1px solid rgba(6,182,212,0.5)",
                        borderRadius: 0,
                        fontFamily: "Azeret Mono, monospace",
                    },
                }}
            />
            <TopBar
                games={topBarGames}
                active={active}
                onSelect={(id) => { setActive(id); setRestartKey((k) => k + 1); }}
                muted={muted}
                onToggleMute={() => setMuted((m) => !m)}
                musicOn={musicOn}
                onToggleMusic={() => setMusicOn((m) => !m)}
                bests={bestsForTopBar}
            />

            <main className="relative z-10 max-w-[1400px] mx-auto px-4 sm:px-6 py-6 grid grid-cols-12 gap-6">
                {/* Canvas / game view */}
                <section className="col-span-12 lg:col-span-8">
                    <div className="mb-4 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
                        <div>
                            <div className="font-mono-hud text-[10px] uppercase tracking-[0.35em] text-slate-500">Now Playing</div>
                            <h1 className="font-display font-black text-4xl sm:text-5xl tracking-tighter neon-cyan-text">
                                {currentGame.title}
                            </h1>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="px-3 py-1.5 bg-black/70 neon-amber-border font-mono-hud text-amber-300 text-xs uppercase tracking-widest" data-testid="personal-best-badge">
                                Personal Best: <span className="text-white ml-1">
                                    {bests[currentGame.id] != null
                                        ? currentGame.formatBest(bests[currentGame.id])
                                        : "—"}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="scanlines relative bg-[#050810] neon-cyan-border-active" style={{ height: "min(70vh, 620px)" }} data-testid="game-viewport">
                        {renderGame()}
                    </div>

                    {/* Game brief */}
                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <InstructionCard active={active} />
                    </div>
                </section>

                {/* Sidebar leaderboards */}
                <aside className="col-span-12 lg:col-span-4 flex flex-col gap-4">
                    <Leaderboard gameId={currentGame.id} gameTitle={currentGame.title} refreshTick={leaderboardTick} />
                    <PersonalStats bests={bests} games={GAMES} />
                </aside>
            </main>

            <footer className="relative z-10 max-w-[1400px] mx-auto px-4 sm:px-6 pb-8 pt-2 font-mono-hud text-[10px] uppercase tracking-[0.35em] text-slate-600">
                Built on Emergent · localStorage + zero-cost API · no assets, no ads
            </footer>

            <TryAgainModal
                open={modalOpen}
                gameId={currentGame.id}
                gameTitle={currentGame.title}
                scoreLabel={currentGame.scoreLabel}
                scoreValue={modalScore.value}
                scoreDisplay={modalScore.display}
                isNewBest={!!(lastResult && lastResult.isNewBest)}
                onClose={handleClose}
                onRetry={handleRetry}
            />
        </div>
    );
};

const InstructionCard = ({ active }) => {
    const map = {
        dontTouchRed: {
            title: "How to play",
            steps: [
                "Drag your cursor or finger to control the cyan dot",
                "Avoid the red chasers approaching from every edge",
                "Speed scales with survival time — stay sharp",
            ],
        },
        towerBloxx: {
            title: "How to play",
            steps: [
                "Block swings across the top on a rope",
                "Tap / click / SPACE to drop it precisely",
                "Overhang is sliced — miss entirely, lose a life (3 max)",
            ],
        },
        matiks: {
            title: "How to play",
            steps: [
                "Tap grid numbers to sum toward the target",
                "Match exactly to score + gain time & combo",
                "Overshoot resets your selection & combo",
            ],
        },
        reflex: {
            title: "How to play",
            steps: [
                "Click to arm the timer, wait through the red screen",
                "Screen flashes GREEN at a random moment — tap ASAP",
                "Sub-200ms = Gamer Reflexes",
            ],
        },
    };
    const cfg = map[active];
    return (
        <div className="bg-black/50 neon-cyan-border p-4">
            <div className="font-mono-hud text-[10px] uppercase tracking-[0.3em] text-cyan-300 mb-2">{cfg.title}</div>
            <ul className="space-y-1.5">
                {cfg.steps.map((s, i) => (
                    <li key={i} className="flex gap-2 text-sm text-slate-300">
                        <span className="text-amber-400 font-mono-hud">{String(i + 1).padStart(2, "0")}</span>
                        <span>{s}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
};

const PersonalStats = ({ bests, games }) => (
    <div className="bg-black/60 neon-cyan-border p-5" data-testid="personal-stats">
        <div className="font-mono-hud text-xs uppercase tracking-[0.3em] text-cyan-300 mb-3">Your Personal Bests</div>
        <div className="grid grid-cols-2 gap-3">
            {games.map((g) => {
                const raw = bests[g.id];
                let display = "—";
                if (raw != null) {
                    if (g.id === "reflex") display = `${1000000 - Number(raw)}ms`;
                    else display = g.formatBest(raw);
                }
                return (
                    <div key={g.id} className="p-2 border border-slate-700/60">
                        <div className="font-mono-hud text-[9px] uppercase tracking-widest text-slate-500">{g.title}</div>
                        <div className="font-mono-hud text-lg neon-amber-text">{display}</div>
                    </div>
                );
            })}
        </div>
    </div>
);

export default Arcade;
