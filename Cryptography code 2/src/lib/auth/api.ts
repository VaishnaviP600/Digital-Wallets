import { supabase } from '../supabase';
import { withAuth, withRole } from './middleware';
import { validatePassword } from './security';
import { getCurrentUser, getAuthenticatedSession } from './session';

// API endpoints for authentication
export const authApi = {
  // Sign up
  signUp: async (email: string, password: string) => {
    const validation = validatePassword(password);
    if (!validation.valid) {
      throw new Error(validation.message);
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
      }
    });

    if (error) throw error;
    return data;
  },

  // Sign in
  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;
    return data;
  },

  // Sign out
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  // Reset password request
  resetPassword: async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) throw error;
  },

  // Update password
  updatePassword: async (newPassword: string) => {
    const validation = validatePassword(newPassword);
    if (!validation.valid) {
      throw new Error(validation.message);
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) throw error;
  },

  // Get current session
  getSession: async () => {
    return await getAuthenticatedSession();
  },

  // Get current user
  getUser: async () => {
    return await getCurrentUser();
  },

  // Update user profile
  updateProfile: async (profile: { [key: string]: any }) => {
    const { error } = await supabase.auth.updateUser({
      data: profile
    });

    if (error) throw error;
  },

  // Verify email
  verifyEmail: async (token: string) => {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: token,
      type: 'email'
    });

    if (error) throw error;
  }
};

// Example of a protected API endpoint
export const protectedApi = {
  getData: async () => {
    return await withAuth(
      new Request('api/data'),
      async (req) => {
        // Your protected API logic here
        return new Response(JSON.stringify({ 
          message: 'Protected data accessed successfully' 
        }));
      }
    );
  },

  // Admin only endpoint
  adminAction: async () => {
    return await withRole(
      'admin',
      async (req) => {
        // Your admin-only API logic here
        return new Response(JSON.stringify({ 
          message: 'Admin action performed successfully' 
        }));
      }
    )(new Request('api/admin/action'));
  }
};