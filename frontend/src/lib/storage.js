// LocalStorage helpers for personal bests, settings, player name.

const KEY_BEST = "hyperarcade.best";        // { [gameId]: number }
const KEY_MUTE = "hyperarcade.muted";       // "1" | "0"
const KEY_MUSIC = "hyperarcade.music";      // "1" | "0"
const KEY_NAME = "hyperarcade.player";      // string

const readJSON = (k, fallback) => {
    try {
        const raw = localStorage.getItem(k);
        return raw ? JSON.parse(raw) : fallback;
    } catch { return fallback; }
};
const writeJSON = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

export const getBests = () => readJSON(KEY_BEST, {});
export const getBest = (gameId) => (readJSON(KEY_BEST, {})[gameId] ?? null);
export const setBest = (gameId, score) => {
    const bests = readJSON(KEY_BEST, {});
    const prev = bests[gameId];
    // For reflex game we still store the "higher-is-better" value; caller converts.
    if (prev == null || score > prev) {
        bests[gameId] = score;
        writeJSON(KEY_BEST, bests);
        return true;
    }
    return false;
};

export const getMuted = () => localStorage.getItem(KEY_MUTE) !== "0"; // default muted
export const setMutedLS = (m) => localStorage.setItem(KEY_MUTE, m ? "1" : "0");

export const getMusicOn = () => localStorage.getItem(KEY_MUSIC) === "1"; // default off
export const setMusicOnLS = (m) => localStorage.setItem(KEY_MUSIC, m ? "1" : "0");

export const getName = () => localStorage.getItem(KEY_NAME) || "";
export const setName = (n) => localStorage.setItem(KEY_NAME, (n || "").slice(0, 20));
