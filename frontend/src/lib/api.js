import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const submitScore = async ({ game, player, score, display }) => {
    const res = await axios.post(`${API}/leaderboard`, { game, player, score, display });
    return res.data;
};

export const fetchLeaderboard = async (game, limit = 10) => {
    const res = await axios.get(`${API}/leaderboard/${game}`, { params: { limit } });
    return res.data;
};

export const fetchAllLeaderboards = async (limit = 5) => {
    const res = await axios.get(`${API}/leaderboard`, { params: { limit } });
    return res.data;
};
