import { useEffect, useState, useCallback } from "react";
import { RefreshCw, Trophy } from "lucide-react";
import { fetchLeaderboard } from "@/lib/api";

const Leaderboard = ({ gameId, gameTitle, refreshTick }) => {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await fetchLeaderboard(gameId, 10);
            setRows(data);
        } catch (e) {
            setError("Offline");
        } finally { setLoading(false); }
    }, [gameId]);

    useEffect(() => { load(); }, [load, refreshTick]);

    return (
        <div className="bg-black/60 neon-cyan-border p-5" data-testid="leaderboard-panel">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Trophy size={16} className="text-amber-400" />
                    <div className="font-mono-hud text-xs uppercase tracking-[0.3em] text-cyan-300">Global Top 10</div>
                </div>
                <button data-testid="leaderboard-refresh" onClick={load} className="text-slate-400 hover:text-cyan-300 transition-colors">
                    <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                </button>
            </div>
            <div className="font-display font-bold text-lg neon-amber-text mb-3">{gameTitle}</div>

            {error && <div className="font-mono-hud text-xs text-red-400">{error}</div>}
            {!error && rows.length === 0 && !loading && (
                <div className="font-mono-hud text-xs text-slate-500 uppercase tracking-widest">No scores yet — be the first</div>
            )}

            <div className="flex flex-col gap-1.5">
                {rows.map((r, i) => (
                    <div key={r.id} className="flex items-center justify-between gap-2 px-2 py-1.5 border border-transparent hover:border-cyan-400/40 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className={`font-mono-hud text-sm w-6 ${i === 0 ? "text-amber-400" : i < 3 ? "text-cyan-300" : "text-slate-500"}`}>
                                {String(i + 1).padStart(2, "0")}
                            </div>
                            <div className="font-mono-hud text-sm text-white truncate max-w-[110px]" title={r.player}>{r.player}</div>
                        </div>
                        <div className="font-mono-hud text-sm text-amber-300">{r.display || r.score}</div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Leaderboard;
