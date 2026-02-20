import { supabase } from './supabase';

// Generate a unique session ID per editor session
export function createSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Fire-and-forget event tracking — never blocks UI
export function trackEvent(
  userId: string,
  eventType: string,
  sessionId: string,
  tone?: string,
  metadata?: Record<string, any>
): void {
  supabase.from('meme_events').insert({
    user_id: userId,
    event_type: eventType,
    tone: tone || null,
    session_id: sessionId,
    metadata: metadata || {},
  }).then(({ error }) => {
    if (error) console.error('Analytics event failed:', error);
  });
}

// Submit meme rating after download
export async function submitRating(
  userId: string,
  rating: number,
  tone: string,
  wouldPost?: 'yes' | 'maybe' | 'nah'
): Promise<void> {
  const { error } = await supabase.from('meme_ratings').insert({
    user_id: userId,
    rating,
    tone,
    would_post: wouldPost || null,
  });
  if (error) console.error('Rating submission failed:', error);
}

// Submit feedback from smart triggers
export async function submitFeedback(
  userId: string,
  triggerType: string,
  response: string
): Promise<void> {
  const { error } = await supabase.from('feedback_responses').insert({
    user_id: userId,
    trigger_type: triggerType,
    response,
  });
  if (error) console.error('Feedback submission failed:', error);
}

// Get total download count for a user (for smart triggers)
export async function getUserDownloadCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('meme_events')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('event_type', 'download');
  if (error) return 0;
  return count || 0;
}
