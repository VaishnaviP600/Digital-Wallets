import { createClient } from '@supabase/supabase-js';
import { supabase } from '../supabase';

// JWT token interface
export interface JWTToken {
  aud: string;         // Audience
  exp: number;         // Expiration time
  sub: string;         // Subject (user ID)
  email: string;       // User email
  role: string;        // User role
  session_id: string;  // Session ID
}

// Get the current session's JWT token
export async function getCurrentToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || null;
}

// Decode JWT token
export function decodeToken(token: string): JWTToken {
  try {
    // Split the token and get the payload
    const base64Payload = token.split('.')[1];
    // Decode base64
    const payload = atob(base64Payload);
    // Parse JSON
    return JSON.parse(payload);
  } catch (error) {
    throw new Error('Invalid token format');
  }
}

// Verify token expiration
export function isTokenExpired(token: string): boolean {
  const decoded = decodeToken(token);
  const currentTime = Math.floor(Date.now() / 1000);
  return decoded.exp < currentTime;
}

// Refresh token if needed
export async function refreshTokenIfNeeded(): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (session && isTokenExpired(session.access_token)) {
    const { data, error } = await supabase.auth.refreshSession();
    if (error) throw error;
  }
}

// Get user info from token
export function getUserFromToken(token: string): { 
  id: string; 
  email: string; 
  role: string 
} {
  const decoded = decodeToken(token);
  return {
    id: decoded.sub,
    email: decoded.email,
    role: decoded.role
  };
}