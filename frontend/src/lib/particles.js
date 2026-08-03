// Canvas particle burst helper. Geometric squares only (no soft circles).

export const createParticleField = () => {
    const particles = [];
    return {
        spawn(x, y, opts = {}) {
            const count = opts.count ?? 14;
            const color = opts.color ?? "#06B6D4";
            const speed = opts.speed ?? 4;
            const life = opts.life ?? 40;
            for (let i = 0; i < count; i++) {
                const a = (Math.PI * 2 * i) / count + Math.random() * 0.4;
                const s = speed * (0.6 + Math.random() * 0.8);
                particles.push({
                    x, y,
                    vx: Math.cos(a) * s,
                    vy: Math.sin(a) * s,
                    life,
                    max: life,
                    size: 3 + Math.random() * 4,
                    color,
                });
            }
        },
        update() {
            for (let i = particles.length - 1; i >= 0; i--) {
                const p = particles[i];
                p.x += p.vx;
                p.y += p.vy;
                p.vx *= 0.94;
                p.vy *= 0.94;
                p.life--;
                if (p.life <= 0) particles.splice(i, 1);
            }
        },
        draw(ctx) {
            for (const p of particles) {
                const alpha = Math.max(0, p.life / p.max);
                ctx.save();
                ctx.globalAlpha = alpha;
                ctx.fillStyle = p.color;
                ctx.shadowBlur = 12;
                ctx.shadowColor = p.color;
                ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
                ctx.restore();
            }
        },
        clear() { particles.length = 0; },
        count() { return particles.length; },
    };
};
