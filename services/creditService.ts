import { supabase } from './supabase';
import { incrementStat } from './statsService';

const ADMIN_EMAIL = 'reelmeme2026@gmail.com';
const DEFAULT_CREDITS = 10;

interface UserCredits {
  credits: number;
  is_unlimited: boolean;
}

/**
 * Fetch or initialize credits for a user from Supabase.
 * If no row exists, creates one with 10 credits (or unlimited for admin).
 */
export async function fetchCredits(userId: string, email: string): Promise<UserCredits> {
  // Try to get existing credits
  const { data, error } = await supabase
    .from('user_credits')
    .select('credits, is_unlimited')
    .eq('user_id', userId)
    .single();

  if (data) {
    return { credits: data.credits, is_unlimited: data.is_unlimited };
  }

  // No row found — create one
  const isAdmin = email.toLowerCase() === ADMIN_EMAIL;
  const newCredits = isAdmin ? 9999 : DEFAULT_CREDITS;

  const { data: inserted, error: insertError } = await supabase
    .from('user_credits')
    .insert({
      user_id: userId,
      email: email.toLowerCase(),
      credits: newCredits,
      is_unlimited: isAdmin,
    })
    .select('credits, is_unlimited')
    .single();

  if (insertError) {
    console.error('Failed to create user credits:', insertError);
    // Fallback: try fetching again (race condition — another tab may have inserted)
    const { data: retry } = await supabase
      .from('user_credits')
      .select('credits, is_unlimited')
      .eq('user_id', userId)
      .single();
    if (retry) {
      return { credits: retry.credits, is_unlimited: retry.is_unlimited };
    }
    return { credits: DEFAULT_CREDITS, is_unlimited: false };
  }

  // New user — increment creators joined stat
  await incrementStat('creatorsJoined');

  return { credits: inserted.credits, is_unlimited: inserted.is_unlimited };
}

/**
 * Decrement credits by 1 in Supabase. Returns the new credit count.
 * Unlimited users are not decremented.
 */
export async function decrementCredits(userId: string): Promise<number> {
  // First check if user is unlimited
  const { data: current } = await supabase
    .from('user_credits')
    .select('credits, is_unlimited')
    .eq('user_id', userId)
    .single();

  if (!current) return 0;
  if (current.is_unlimited) return current.credits;

  const newCredits = Math.max(0, current.credits - 1);

  await supabase
    .from('user_credits')
    .update({ credits: newCredits, updated_at: new Date().toISOString() })
    .eq('user_id', userId);

  return newCredits;
}
