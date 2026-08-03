// Lightweight Web Audio synth engine for HyperArcade.
// Handles SFX beeps + a subtle background chiptune loop.
// No external assets — everything synthesised on-the-fly.

let ctx = null;
let masterGain = null;
let musicNodes = null;
let muted = true;
let musicOn = false;

const ensure = () => {
    if (typeof window === "undefined") return null;
    if (!ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;
        ctx = new AC();
        masterGain = ctx.createGain();
        masterGain.gain.value = muted ? 0 : 0.6;
        masterGain.connect(ctx.destination);
    }
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    return ctx;
};

export const setMuted = (m) => {
    muted = !!m;
    ensure();
    if (masterGain) masterGain.gain.value = muted ? 0 : 0.6;
};

export const isMuted = () => muted;

const beep = (freq, dur = 0.08, type = "square", vol = 0.25) => {
    const c = ensure();
    if (!c || muted) return;
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0, c.currentTime);
    g.gain.linearRampToValueAtTime(vol, c.currentTime + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
    osc.connect(g);
    g.connect(masterGain);
    osc.start();
    osc.stop(c.currentTime + dur + 0.02);
};

export const sfx = {
    click: () => beep(880, 0.05, "square", 0.15),
    score: () => {
        beep(660, 0.06, "square", 0.2);
        setTimeout(() => beep(990, 0.08, "square", 0.2), 60);
    },
    hit: () => {
        beep(180, 0.14, "sawtooth", 0.35);
        setTimeout(() => beep(80, 0.2, "sawtooth", 0.3), 80);
    },
    drop: () => beep(320, 0.06, "triangle", 0.25),
    place: () => beep(520, 0.08, "square", 0.22),
    tick: () => beep(1200, 0.03, "square", 0.08),
    win: () => {
        [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => beep(f, 0.1, "square", 0.22), i * 70));
    },
    fail: () => {
        [400, 300, 200].forEach((f, i) => setTimeout(() => beep(f, 0.12, "sawtooth", 0.28), i * 90));
    },
    flash: () => beep(1400, 0.08, "square", 0.25),
};

// Background chip loop: simple 8-step arpeggio
const NOTES = [130.81, 164.81, 196.0, 246.94, 196.0, 164.81, 130.81, 98.0];

export const startMusic = () => {
    const c = ensure();
    if (!c) return;
    if (musicOn) return;
    musicOn = true;
    const bpm = 120;
    const stepMs = 60000 / bpm / 2;

    const bassGain = c.createGain();
    bassGain.gain.value = 0.08;
    bassGain.connect(masterGain);

    let step = 0;
    const tick = () => {
        if (!musicOn) return;
        const osc = c.createOscillator();
        const g = c.createGain();
        osc.type = "square";
        osc.frequency.value = NOTES[step % NOTES.length];
        g.gain.setValueAtTime(0, c.currentTime);
        g.gain.linearRampToValueAtTime(0.12, c.currentTime + 0.005);
        g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.14);
        osc.connect(g);
        g.connect(bassGain);
        osc.start();
        osc.stop(c.currentTime + 0.16);
        step++;
        musicNodes = { bassGain };
        setTimeout(tick, stepMs);
    };
    tick();
};

export const stopMusic = () => {
    musicOn = false;
    if (musicNodes && musicNodes.bassGain) {
        try { musicNodes.bassGain.disconnect(); } catch (_) {}
    }
    musicNodes = null;
};

export const isMusicOn = () => musicOn;
