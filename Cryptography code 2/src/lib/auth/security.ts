import { createClient } from '@supabase/supabase-js';
import { supabase } from '../supabase';

// Password security settings
const SECURITY_CONFIG = {
  BCRYPT_ROUNDS: 10,              // Number of bcrypt hashing rounds
  MIN_PASSWORD_LENGTH: 8,         // Minimum password length
  PEPPER: process.env.PEPPER_KEY, // Server-side pepper (handled by Supabase)
  TOKEN_EXPIRY: 3600,            // Token expiry in seconds
  REFRESH_TOKEN_EXPIRY: 86400    // Refresh token expiry in seconds
};

// Password validation
export function validatePassword(password: string): { 
  valid: boolean; 
  message?: string 
} {
  if (password.length < SECURITY_CONFIG.MIN_PASSWORD_LENGTH) {
    return {
      valid: false,
      message: `Password must be at least ${SECURITY_CONFIG.MIN_PASSWORD_LENGTH} characters long`
    };
  }

  // Check for at least one uppercase letter
  if (!/[A-Z]/.test(password)) {
    return {
      valid: false,
      message: 'Password must contain at least one uppercase letter'
    };
  }

  // Check for at least one lowercase letter
  if (!/[a-z]/.test(password)) {
    return {
      valid: false,
      message: 'Password must contain at least one lowercase letter'
    };
  }

  // Check for at least one number
  if (!/\d/.test(password)) {
    return {
      valid: false,
      message: 'Password must contain at least one number'
    };
  }

  // Check for at least one special character
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return {
      valid: false,
      message: 'Password must contain at least one special character'
    };
  }

  return { valid: true };
}

// Enhanced sign up with password validation
export async function signUpWithValidation(
  email: string,
  password: string
): Promise<{ user: any; error: any }> {
  // Validate password
  const validation = validatePassword(password);
  if (!validation.valid) {
    return { 
      user: null, 
      error: new Error(validation.message) 
    };
  }

  // Attempt to create user
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: window.location.origin,
      data: {
        created_at: new Date().toISOString(),
        last_password_change: new Date().toISOString()
      }
    }
  });

  return { user: data.user, error };
}

// Password change with validation
export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate new password
    const validation = validatePassword(newPassword);
    if (!validation.valid) {
      return { 
        success: false, 
        error: validation.message 
      };
    }

    // Verify current password
    const { data: { user }, error: signInError } = await supabase.auth.signInWithPassword({
      email: (await getCurrentUser()).email!,
      password: currentPassword
    });

    if (signInError) {
      return { 
        success: false, 
        error: 'Current password is incorrect' 
      };
    }

    // Change password
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    return { 
      success: false, 
      error: error.message 
    };
  }
}

// Get password hash info (for demonstration - Supabase handles this internally)
export function getHashInfo(hash: string): {
  rounds: number;
  salt: string;
  hash: string;
} {
  // Format: $2b$10$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewKxcQw8SI9U4J5C
  // $2b$ - bcrypt algorithm identifier
  // 10$ - number of rounds
  // LQv3c1yqBWVHxkd0LHAkCO - salt
  // Yz6TtxMQJqhN8/LewKxcQw8SI9U4J5C - hash
  const parts = hash.split('$');
  return {
    rounds: parseInt(parts[2]),
    salt: parts[3].slice(0, 22),
    hash: parts[3].slice(22)
  };
}