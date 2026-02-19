import { supabase } from './supabase';
import { SiteStats } from '../types';

const DEFAULT_STATS: SiteStats = {
  memesCreated: 0,
  downloads: 0,
  creatorsJoined: 0,
};

export const getStats = async (): Promise<SiteStats> => {
  const { data, error } = await supabase
    .from('site_stats')
    .select('memes_created, downloads, creators_joined')
    .eq('id', 1)
    .single();

  if (error || !data) {
    return DEFAULT_STATS;
  }

  return {
    memesCreated: data.memes_created,
    downloads: data.downloads,
    creatorsJoined: data.creators_joined,
  };
};

export const incrementStat = async (key: keyof SiteStats) => {
  const columnMap: Record<keyof SiteStats, string> = {
    memesCreated: 'memes_created',
    downloads: 'downloads',
    creatorsJoined: 'creators_joined',
  };

  const column = columnMap[key];

  // Fetch current value, then increment
  const { data } = await supabase
    .from('site_stats')
    .select(column)
    .eq('id', 1)
    .single();

  if (data) {
    await supabase
      .from('site_stats')
      .update({ [column]: (data as any)[column] + 1 })
      .eq('id', 1);
  }
};

export const pollStats = (callback: (stats: SiteStats) => void, interval = 15000) => {
  // Initial fetch
  getStats().then(callback);

  const timer = setInterval(() => {
    getStats().then(callback);
  }, interval);

  return () => clearInterval(timer);
};
