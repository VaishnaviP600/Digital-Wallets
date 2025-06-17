import { supabase } from '../supabase';
import { getCurrentToken, refreshTokenIfNeeded } from './tokens';

// Session management
export async function getSession() {
  await refreshTokenIfNeeded();
  return await supabase.auth.getSession();
}

// Get current user
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
}

// Check if user is authenticated
export async function isAuthenticated(): Promise<boolean> {
  const token = await getCurrentToken();
  return !!token;
}

// Get session data with automatic refresh
export async function getAuthenticatedSession() {
  await refreshTokenIfNeeded();
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error) throw error;
  if (!session) throw new Error('No active session');
  
  return session;
}