import { SiteStats } from "../types";

const INITIAL_STATS: SiteStats = {
  memesCreated: 18423,
  downloads: 6912,
  creatorsJoined: 3201
};

const STATS_KEY = 'memereel_global_stats';

export const getStats = (): SiteStats => {
  const stored = localStorage.getItem(STATS_KEY);
  if (!stored) {
    localStorage.setItem(STATS_KEY, JSON.stringify(INITIAL_STATS));
    return INITIAL_STATS;
  }
  return JSON.parse(stored);
};

export const incrementStat = (key: keyof SiteStats) => {
  const stats = getStats();
  stats[key] += 1;
  localStorage.setItem(STATS_KEY, JSON.stringify(stats));
};

export const pollStats = (callback: (stats: SiteStats) => void, interval = 15000) => {
  const timer = setInterval(() => {
    callback(getStats());
  }, interval);
  return () => clearInterval(timer);
};
