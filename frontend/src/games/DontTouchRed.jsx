import { useEffect, useRef, useState } from "react";
import { sfx } from "@/lib/audio";
import { createParticleField } from "@/lib/particles";

// Endless reflex survival — dodge red chasers with cursor / finger.
const GameCanvas = ({ onGameOver, onScoreTick, running, restartKey }) => {
    const canvasRef = useRef(null);
    const stateRef = useRef(null);
    const [dims, setDims] = useState({ w: 800, h: 500 });

    useEffect(() => {
        const el = canvasRef.current?.parentElement;
        if (!el) return;
        const ro = new ResizeObserver(() => {
            const rect = el.getBoundingClientRect();
            setDims({ w: Math.max(300, rect.width), h: Math.max(300, rect.height) });
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

        const state = {
            player: { x: dims.w / 2, y: dims.h / 2, r: 12, targetX: dims.w / 2, targetY: dims.h / 2 },
            enemies: [],
            startTime: performance.now(),
            spawnTimer: 0,
            over: false,
            raf: 0,
        };
        stateRef.current = state;

        const spawnEnemy = () => {
            const side = Math.floor(Math.random() * 4);
            const speed = 1.2 + Math.min(3.2, (performance.now() - state.startTime) / 12000);
            let x, y;
            if (side === 0) { x = Math.random() * dims.w; y = -20; }
            else if (side === 1) { x = dims.w + 20; y = Math.random() * dims.h; }
            else if (side === 2) { x = Math.random() * dims.w; y = dims.h + 20; }
            else { x = -20; y = Math.random() * dims.h; }
            state.enemies.push({ x, y, r: 10 + Math.random() * 4, speed });
        };

        const onMove = (e) => {
            const rect = canvas.getBoundingClientRect();
            const cx = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
            const cy = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            state.player.targetX = cx * scaleX;
            state.player.targetY = cy * scaleY;
        };

        canvas.addEventListener("mousemove", onMove);
        canvas.addEventListener("touchmove", onMove, { passive: true });
        canvas.addEventListener("touchstart", onMove, { passive: true });

        const loop = () => {
            if (!running) return;
            if (state.over) return;

            // Update player (smooth follow)
            state.player.x += (state.player.targetX - state.player.x) * 0.35;
            state.player.y += (state.player.targetY - state.player.y) * 0.35;

            // Spawn
            state.spawnTimer++;
            const interval = Math.max(14, 40 - Math.floor((performance.now() - state.startTime) / 1500));
            if (state.spawnTimer >= interval) {
                state.spawnTimer = 0;
                spawnEnemy();
            }

            // Update enemies
            for (const e of state.enemies) {
                const dx = state.player.x - e.x;
                const dy = state.player.y - e.y;
                const d = Math.hypot(dx, dy) || 1;
                e.x += (dx / d) * e.speed;
                e.y += (dy / d) * e.speed;

                if (d < e.r + state.player.r) {
                    state.over = true;
                    sfx.hit();
                    particles.spawn(state.player.x, state.player.y, { color: "#FF3B30", count: 26, speed: 6, life: 55 });
                }
            }

            // Draw background
            ctx.fillStyle = "#090D16";
            ctx.fillRect(0, 0, dims.w, dims.h);

            // Grid
            ctx.strokeStyle = "rgba(6, 182, 212, 0.09)";
            ctx.lineWidth = 1;
            for (let x = 0; x < dims.w; x += 40) {
                ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, dims.h); ctx.stroke();
            }
            for (let y = 0; y < dims.h; y += 40) {
                ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(dims.w, y); ctx.stroke();
            }

            // Enemies
            for (const e of state.enemies) {
                ctx.save();
                ctx.shadowBlur = 20; ctx.shadowColor = "#FF3B30";
                ctx.fillStyle = "#FF3B30";
                ctx.beginPath(); ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2); ctx.fill();
                ctx.restore();
            }

            // Player
            if (!state.over) {
                ctx.save();
                ctx.shadowBlur = 22; ctx.shadowColor = "#06B6D4";
                ctx.fillStyle = "#06B6D4";
                ctx.beginPath(); ctx.arc(state.player.x, state.player.y, state.player.r, 0, Math.PI * 2); ctx.fill();
                ctx.restore();
            }

            particles.update();
            particles.draw(ctx);

            // HUD tick
            const elapsed = (performance.now() - state.startTime) / 1000;
            onScoreTick && onScoreTick(elapsed);

            if (state.over) {
                setTimeout(() => onGameOver(elapsed), 500);
                return;
            }

            state.raf = requestAnimationFrame(loop);
        };

        state.raf = requestAnimationFrame(loop);

        return () => {
            cancelAnimationFrame(state.raf);
            canvas.removeEventListener("mousemove", onMove);
            canvas.removeEventListener("touchmove", onMove);
            canvas.removeEventListener("touchstart", onMove);
        };
        // eslint-disable-next-line
    }, [dims.w, dims.h, running, restartKey]);

    return <canvas ref={canvasRef} data-testid="dtr-canvas" className="w-full h-full block no-select" />;
};

const DontTouchRed = ({ onEnd, restartKey }) => {
    const [seconds, setSeconds] = useState(0);
    return (
        <div className="relative w-full h-full">
            <div className="absolute top-3 left-3 z-10 px-3 py-1.5 bg-black/70 neon-cyan-border font-mono-hud text-cyan-300 text-sm tracking-widest" data-testid="dtr-hud">
                SURVIVED <span className="neon-amber-text text-lg ml-2">{seconds.toFixed(2)}s</span>
            </div>
            <GameCanvas
                running={true}
                onScoreTick={setSeconds}
                onGameOver={(t) => onEnd(t)}
                restartKey={restartKey}
            />
        </div>
    );
};

export default DontTouchRed;
