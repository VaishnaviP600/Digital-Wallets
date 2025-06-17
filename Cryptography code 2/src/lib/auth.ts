import { supabase } from './supabase';
import toast from 'react-hot-toast';

export interface AuthError {
  message: string;
}

export async function signUp(email: string, password: string) {
  try {
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    console.error('Sign up error:', error);
    return { 
      data: null, 
      error: { 
        message: error.message || 'Failed to sign up' 
      } 
    };
  }
}

export async function signIn(email: string, password: string) {
  try {
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new Error(
        error.message === 'Invalid login credentials'
          ? 'Invalid email or password'
          : error.message
      );
    }

    return { data, error: null };
  } catch (error: any) {
    console.error('Sign in error:', error);
    return { 
      data: null, 
      error: { 
        message: error.message || 'Failed to sign in' 
      } 
    };
  }
}

export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { error: null };
  } catch (error: any) {
    console.error('Sign out error:', error);
    return { 
      error: { 
        message: error.message || 'Failed to sign out' 
      } 
    };
  }
}

export async function useAuth() {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    console.error('Auth error:', error);
    return { 
      data: null, 
      error: { 
        message: error.message || 'Authentication error' 
      } 
    };
  }
}

export async function resetPassword(email: string) {
  try {
    if (!email) {
      throw new Error('Email is required');
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) throw error;
    return { error: null };
  } catch (error: any) {
    console.error('Reset password error:', error);
    return {
      error: {
        message: error.message || 'Failed to send reset password email'
      }
    };
  }
}

export async function updatePassword(newPassword: string) {
  try {
    if (!newPassword) {
      throw new Error('New password is required');
    }

    if (newPassword.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) throw error;
    return { error: null };
  } catch (error: any) {
    console.error('Update password error:', error);
    return {
      error: {
        message: error.message || 'Failed to update password'
      }
    };
  }
}