import { Volume2, VolumeX, Music, MicOff, Gamepad2 } from "lucide-react";

const TopBar = ({ games, active, onSelect, muted, onToggleMute, musicOn, onToggleMusic, bests }) => {
    return (
        <header className="sticky top-0 z-40 bg-[#090D16]/85 backdrop-blur-md border-b border-cyan-400/20">
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-3 flex flex-col md:flex-row md:items-center gap-4">
                {/* Brand */}
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 flex items-center justify-center bg-cyan-400 text-black neon-cyan-border-active">
                        <Gamepad2 size={18} />
                    </div>
                    <div>
                        <div className="font-display font-black text-xl tracking-tighter leading-none">
                            <span className="neon-cyan-text">HYPER</span><span className="neon-amber-text">ARCADE</span>
                        </div>
                        <div className="font-mono-hud text-[10px] uppercase tracking-[0.35em] text-slate-500 mt-0.5">Zero-Cost Reflex Lab</div>
                    </div>
                </div>

                {/* Tabs */}
                <nav className="flex-1 flex flex-wrap gap-1" data-testid="game-tabs">
                    {games.map((g) => (
                        <button
                            key={g.id}
                            data-testid={`game-tab-${g.id}`}
                            onClick={() => onSelect(g.id)}
                            className={`relative px-3 sm:px-4 py-2 font-mono-hud text-xs uppercase tracking-[0.2em] transition-[color,background-color,border-color] duration-150
                                ${active === g.id
                                    ? "text-amber-400 bg-black/40"
                                    : "text-slate-400 hover:text-cyan-300 bg-transparent"}`}
                        >
                            {g.title}
                            {active === g.id && (
                                <span className="absolute left-0 right-0 bottom-0 h-[3px] bg-cyan-400 shadow-[0_0_10px_#06B6D4]" />
                            )}
                            {bests[g.id] != null && (
                                <span className="ml-2 text-[10px] text-amber-300/80">★{g.formatBest(bests[g.id])}</span>
                            )}
                        </button>
                    ))}
                </nav>

                {/* Controls */}
                <div className="flex items-center gap-2">
                    <button
                        data-testid="mute-toggle"
                        onClick={onToggleMute}
                        className="btn-ghost flex items-center gap-2"
                        title={muted ? "Unmute" : "Mute"}
                    >
                        {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                        <span className="font-mono-hud text-[10px] uppercase tracking-widest hidden sm:inline">{muted ? "Muted" : "Sound"}</span>
                    </button>
                    <button
                        data-testid="music-toggle"
                        onClick={onToggleMusic}
                        className={`btn-ghost flex items-center gap-2 ${musicOn ? "text-cyan-300 border-cyan-400/70" : ""}`}
                        title={musicOn ? "Stop music" : "Play music"}
                    >
                        {musicOn ? <Music size={16} /> : <MicOff size={16} />}
                        <span className="font-mono-hud text-[10px] uppercase tracking-widest hidden sm:inline">{musicOn ? "Loop" : "No Loop"}</span>
                    </button>
                </div>
            </div>
        </header>
    );
};

export default TopBar;
