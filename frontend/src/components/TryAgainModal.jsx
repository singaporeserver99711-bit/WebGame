import { useEffect, useState } from "react";
import { X, Copy, Trophy, Send } from "lucide-react";
import { toast } from "sonner";
import { getName, setName as saveName } from "@/lib/storage";
import { submitScore } from "@/lib/api";

const TryAgainModal = ({ open, gameId, gameTitle, scoreLabel, scoreValue, scoreDisplay, isNewBest, onClose, onRetry }) => {
    const [name, setName] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        if (open) {
            setName(getName());
            setSubmitted(false);
        }
    }, [open]);

    if (!open) return null;

    const copy = async () => {
        const text = `I scored ${scoreDisplay} on ${gameTitle} at HyperArcade — beat me: hyperarcade.app`;
        try {
            await navigator.clipboard.writeText(text);
            toast.success("Score copied to clipboard");
        } catch {
            toast.error("Clipboard blocked — copy manually");
        }
    };

    const submit = async () => {
        const cleaned = (name || "Anon").trim().slice(0, 20) || "Anon";
        saveName(cleaned);
        setSubmitting(true);
        try {
            await submitScore({ game: gameId, player: cleaned, score: scoreValue, display: scoreDisplay });
            toast.success("Submitted to Global Leaderboard");
            setSubmitted(true);
        } catch (e) {
            toast.error("Submission failed. Check connection.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(9,13,22,0.85)", backdropFilter: "blur(14px)" }} data-testid="try-again-modal">
            <div className="relative w-full max-w-md bg-[#0D0D1A] neon-cyan-border-active">
                <div className="flex items-center justify-between px-5 py-3 border-b border-cyan-400/30">
                    <div className="font-mono-hud text-xs tracking-[0.3em] uppercase text-cyan-300">Round Complete</div>
                    <button data-testid="close-modal-btn" onClick={onClose} className="text-slate-400 hover:text-cyan-300 transition-colors">
                        <X size={18} />
                    </button>
                </div>

                <div className="px-6 py-6">
                    <div className="font-display font-black text-3xl neon-cyan-text mb-1">{gameTitle}</div>
                    <div className="font-mono-hud text-xs uppercase tracking-[0.3em] text-slate-400 mb-4">{scoreLabel}</div>
                    <div className="font-mono-hud font-black text-6xl neon-amber-text" data-testid="modal-score">{scoreDisplay}</div>

                    {isNewBest && (
                        <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-400 text-amber-300 text-xs font-mono-hud uppercase tracking-widest">
                            <Trophy size={14} /> New Personal Best!
                        </div>
                    )}

                    {/* Global submission */}
                    <div className="mt-6">
                        <label className="font-mono-hud text-xs uppercase tracking-[0.25em] text-slate-400">Post to Global Board</label>
                        <div className="mt-2 flex gap-2">
                            <input
                                data-testid="player-name-input"
                                className="hyper-input flex-1"
                                placeholder="Your handle"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                maxLength={20}
                                disabled={submitted}
                            />
                            <button
                                data-testid="submit-global-btn"
                                onClick={submit}
                                disabled={submitting || submitted}
                                className={`btn-primary flex items-center gap-2 ${(submitting || submitted) ? "opacity-60 cursor-not-allowed" : ""}`}
                            >
                                <Send size={14} /> {submitted ? "Posted" : submitting ? "…" : "Post"}
                            </button>
                        </div>
                    </div>

                    <div className="mt-5 flex flex-col sm:flex-row gap-3">
                        <button data-testid="try-again-btn" onClick={onRetry} className="btn-primary flex-1">
                            Try Again
                        </button>
                        <button data-testid="copy-score-btn" onClick={copy} className="btn-secondary flex items-center justify-center gap-2 flex-1">
                            <Copy size={14} /> Copy Score
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TryAgainModal;
