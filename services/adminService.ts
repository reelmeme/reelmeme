import { supabase } from './supabase';

// Average rating per day (last 30 days)
export async function getAvgRatingPerDay(): Promise<Array<{ date: string; avg_rating: number; count: number }>> {
  const { data, error } = await supabase
    .from('meme_ratings')
    .select('rating, created_at')
    .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
    .order('created_at', { ascending: true });

  if (error || !data) return [];

  const grouped: Record<string, { sum: number; count: number }> = {};
  for (const row of data) {
    const date = new Date(row.created_at).toISOString().split('T')[0];
    if (!grouped[date]) grouped[date] = { sum: 0, count: 0 };
    grouped[date].sum += row.rating;
    grouped[date].count += 1;
  }

  return Object.entries(grouped).map(([date, { sum, count }]) => ({
    date,
    avg_rating: Math.round((sum / count) * 10) / 10,
    count,
  }));
}

// Most popular tone by downloads
export async function getPopularTones(): Promise<Array<{ tone: string; count: number }>> {
  const { data, error } = await supabase
    .from('meme_events')
    .select('tone')
    .eq('event_type', 'download')
    .not('tone', 'is', null);

  if (error || !data) return [];

  const counts: Record<string, number> = {};
  for (const row of data) {
    counts[row.tone] = (counts[row.tone] || 0) + 1;
  }

  return Object.entries(counts)
    .map(([tone, count]) => ({ tone, count }))
    .sort((a, b) => b.count - a.count);
}

// Download-to-share ratio
export async function getDownloadShareRatio(): Promise<{ downloads: number; shares: number; ratio: string }> {
  const { count: downloads } = await supabase
    .from('meme_events')
    .select('*', { count: 'exact', head: true })
    .eq('event_type', 'download');

  const { count: shares } = await supabase
    .from('meme_events')
    .select('*', { count: 'exact', head: true })
    .eq('event_type', 'share');

  const d = downloads || 0;
  const s = shares || 0;
  return {
    downloads: d,
    shares: s,
    ratio: d > 0 ? `${Math.round((s / d) * 100)}%` : '0%',
  };
}

// 7-day user retention
export async function get7DayRetention(): Promise<{ totalUsers: number; returnedUsers: number; rate: string }> {
  const { data, error } = await supabase
    .from('meme_events')
    .select('user_id, created_at')
    .order('created_at', { ascending: true });

  if (error || !data) return { totalUsers: 0, returnedUsers: 0, rate: '0%' };

  const userDates: Record<string, { first: Date; last: Date }> = {};
  for (const row of data) {
    const d = new Date(row.created_at);
    if (!userDates[row.user_id]) {
      userDates[row.user_id] = { first: d, last: d };
    } else {
      if (d < userDates[row.user_id].first) userDates[row.user_id].first = d;
      if (d > userDates[row.user_id].last) userDates[row.user_id].last = d;
    }
  }

  const totalUsers = Object.keys(userDates).length;
  const returnedUsers = Object.values(userDates).filter(
    ({ first, last }) => last.getTime() - first.getTime() >= 7 * 24 * 60 * 60 * 1000
  ).length;

  return {
    totalUsers,
    returnedUsers,
    rate: totalUsers > 0 ? `${Math.round((returnedUsers / totalUsers) * 100)}%` : '0%',
  };
}

// Recent feedback responses
export async function getRecentFeedback(): Promise<Array<{ trigger_type: string; response: string; created_at: string }>> {
  const { data, error } = await supabase
    .from('feedback_responses')
    .select('trigger_type, response, created_at')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error || !data) return [];
  return data;
}
