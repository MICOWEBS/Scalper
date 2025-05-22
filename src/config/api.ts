const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://wbtx.onrender.com';

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: `${API_BASE_URL}/auth/login`,
    REGISTER: `${API_BASE_URL}/auth/register`,
  },
  BOT: {
    START: `${API_BASE_URL}/bot/start`,
    STOP: `${API_BASE_URL}/bot/stop`,
  },
  STATS: {
    OVERVIEW: `${API_BASE_URL}/stats`,
    DAILY: `${API_BASE_URL}/stats/daily`,
  },
  TRADES: {
    LIST: `${API_BASE_URL}/trades`,
    EXPORT: `${API_BASE_URL}/trades/csv`,
    STATS: `${API_BASE_URL}/trades/stats`,
  },
  SIGNALS: {
    LIST: `${API_BASE_URL}/signals`,
    EXPORT: `${API_BASE_URL}/signals/export`,
  },
  WALLET: {
    BALANCES: `${API_BASE_URL}/wallet/balances`,
  },
  WEBSOCKET: `wss://wbtx.onrender.com/ws`,
} as const;

export const getAuthHeader = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (!token) {
    console.warn('No auth token found');
    return {};
  }
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}; 
