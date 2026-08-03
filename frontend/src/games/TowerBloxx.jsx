import { useEffect, useRef, useState } from "react";
import { sfx } from "@/lib/audio";
import { createParticleField } from "@/lib/particles";

// Tower Bloxx Stacker — tap to drop swinging block; overhang gets chopped.
const TowerBloxx = ({ onEnd, restartKey }) => {
    const canvasRef = useRef(null);
    const [dims, setDims] = useState({ w: 800, h: 500 });
    const [stack, setStack] = useState(0);
    const [lives, setLives] = useState(3);

    useEffect(() => {
        const el = canvasRef.current?.parentElement;
        if (!el) return;
        const ro = new ResizeObserver(() => {
            const rect = el.getBoundingClientRect();
            setDims({ w: Math.max(300, rect.width), h: Math.max(400, rect.height) });
        });
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        canvas.width = dims.w;
        canvas.height = dims.h;
        const ctx = canvas.getContext("2d");
        const particles = createParticleField();

        const BASE_W = Math.min(200, dims.w * 0.35);
        const BLOCK_H = 24;
        const groundY = dims.h - 60;

        const state = {
            blocks: [{ x: dims.w / 2 - BASE_W / 2, y: groundY, w: BASE_W, h: BLOCK_H, color: "#F59E0B" }],
            current: null, // swinging block
            falling: null,
            phase: "swing", // swing | falling | over
            swingT: 0,
            score: 0,
            lives: 3,
            raf: 0,
            over: false,
        };

        const spawnSwinging = () => {
            const top = state.blocks[state.blocks.length - 1];
            state.current = {
                x: dims.w / 2 - top.w / 2,
                y: 40,
                w: top.w,
                h: BLOCK_H,
                color: state.blocks.length % 2 === 0 ? "#F59E0B" : "#06B6D4",
            };
            state.phase = "swing";
            state.swingT = Math.random() * Math.PI * 2;
        };

        const drop = () => {
            if (state.phase !== "swing" || !state.current) return;
            state.falling = { ...state.current, vy: 0 };
            state.current = null;
            state.phase = "falling";
            sfx.drop();
        };

        const onTap = (e) => {
            e.preventDefault();
            drop();
        };
        canvas.addEventListener("mousedown", onTap);
        canvas.addEventListener("touchstart", onTap, { passive: false });
        const onKey = (e) => { if (e.code === "Space") drop(); };
        window.addEventListener("keydown", onKey);

        spawnSwinging();

        const draw = () => {
            // Sky
            ctx.fillStyle = "#090D16";
            ctx.fillRect(0, 0, dims.w, dims.h);

            // Grid
            ctx.strokeStyle = "rgba(6, 182, 212, 0.08)";
            for (let x = 0; x < dims.w; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, dims.h); ctx.stroke(); }
            for (let y = 0; y < dims.h; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(dims.w, y); ctx.stroke(); }

            // Ground
            ctx.strokeStyle = "rgba(6, 182, 212, 0.5)";
            ctx.beginPath(); ctx.moveTo(0, groundY + BLOCK_H); ctx.lineTo(dims.w, groundY + BLOCK_H); ctx.stroke();

            // Camera scroll if tower too tall
            const targetTop = state.blocks[state.blocks.length - 1].y;
            const camOffset = Math.max(0, 180 - targetTop);

            ctx.save();
            ctx.translate(0, camOffset);

            // Blocks
            for (const b of state.blocks) {
                ctx.save();
                ctx.shadowBlur = 18; ctx.shadowColor = b.color;
                ctx.fillStyle = b.color;
                ctx.fillRect(b.x, b.y, b.w, b.h);
                ctx.restore();
                ctx.strokeStyle = "rgba(0,0,0,0.4)";
                ctx.strokeRect(b.x + 0.5, b.y + 0.5, b.w - 1, b.h - 1);
            }

            // Swinging block
            if (state.current) {
                state.swingT += 0.055;
                const amp = dims.w * 0.35;
                const cx = dims.w / 2 + Math.sin(state.swingT) * amp;
                state.current.x = cx - state.current.w / 2;

                // Rope
                ctx.strokeStyle = "rgba(6,182,212,0.7)";
                ctx.beginPath();
                ctx.moveTo(dims.w / 2, 0 - camOffset);
                ctx.lineTo(cx, state.current.y - camOffset);
                ctx.stroke();

                ctx.save();
                ctx.shadowBlur = 20; ctx.shadowColor = state.current.color;
                ctx.fillStyle = state.current.color;
                ctx.fillRect(state.current.x, state.current.y, state.current.w, state.current.h);
                ctx.restore();
            }

            // Falling block
            if (state.falling) {
                state.falling.vy += 0.9;
                state.falling.y += state.falling.vy;

                const top = state.blocks[state.blocks.length - 1];
                const landY = top.y - BLOCK_H;
                if (state.falling.y >= landY) {
                    state.falling.y = landY;
                    // Compute overlap with top
                    const leftEdge = Math.max(state.falling.x, top.x);
                    const rightEdge = Math.min(state.falling.x + state.falling.w, top.x + top.w);
                    const overlap = rightEdge - leftEdge;

                    if (overlap <= 0) {
                        // Missed entirely — lose a life
                        state.lives -= 1;
                        setLives(state.lives);
                        sfx.fail();
                        particles.spawn(state.falling.x + state.falling.w / 2, state.falling.y, {
                            color: "#FF3B30", count: 22, speed: 5, life: 45,
                        });
                        state.falling = null;
                        if (state.lives <= 0) {
                            state.over = true;
                            setTimeout(() => onEnd(state.score), 600);
                            return;
                        }
                        spawnSwinging();
                    } else {
                        // Chop overhang
                        const newBlock = { x: leftEdge, y: landY, w: overlap, h: BLOCK_H, color: state.falling.color };
                        state.blocks.push(newBlock);
                        state.score += 1 + Math.floor(overlap / 20);
                        setStack(state.blocks.length - 1);
                        sfx.place();
                        particles.spawn(leftEdge + overlap / 2, landY, {
                            color: "#06B6D4", count: 12, speed: 3.5, life: 32,
                        });
                        state.falling = null;
                        spawnSwinging();
                    }
                }
                if (state.falling) {
                    ctx.save();
                    ctx.shadowBlur = 20; ctx.shadowColor = state.falling.color;
                    ctx.fillStyle = state.falling.color;
                    ctx.fillRect(state.falling.x, state.falling.y, state.falling.w, state.falling.h);
                    ctx.restore();
                }
            }

            particles.update();
            particles.draw(ctx);
            ctx.restore();

            if (!state.over) state.raf = requestAnimationFrame(draw);
        };

        state.raf = requestAnimationFrame(draw);

        return () => {
            cancelAnimationFrame(state.raf);
            canvas.removeEventListener("mousedown", onTap);
            canvas.removeEventListener("touchstart", onTap);
            window.removeEventListener("keydown", onKey);
        };
        // eslint-disable-next-line
    }, [dims.w, dims.h, restartKey]);

    return (
        <div className="relative w-full h-full">
            <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
                <div className="px-3 py-1.5 bg-black/70 neon-cyan-border font-mono-hud text-cyan-300 text-sm tracking-widest" data-testid="tb-stack-hud">
                    STACK <span className="neon-amber-text text-lg ml-2">{stack}</span>
                </div>
                <div className="px-3 py-1.5 bg-black/70 neon-amber-border font-mono-hud text-amber-400 text-sm tracking-widest" data-testid="tb-lives-hud">
                    LIVES <span className="text-lg ml-2 text-white">{"".padStart(0)}{Array.from({ length: lives }).map(() => "▲").join(" ")}</span>
                </div>
            </div>
            <div className="absolute bottom-3 right-3 z-10 px-3 py-1.5 bg-black/70 neon-cyan-border font-mono-hud text-cyan-300 text-xs uppercase tracking-widest">
                Tap / Click / Space to drop
            </div>
            <canvas ref={canvasRef} data-testid="tb-canvas" className="w-full h-full block no-select" />
        </div>
    );
};

export default TowerBloxx;
