import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

if (!import.meta.env.VITE_SUPABASE_URL) {
  throw new Error('Missing environment variable: VITE_SUPABASE_URL');
}

if (!import.meta.env.VITE_SUPABASE_ANON_KEY) {
  throw new Error('Missing environment variable: VITE_SUPABASE_ANON_KEY');
}

export const supabase = createClient<Database>(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function signUp(email: string, password: string, metadata: {
  full_name: string;
  phone: string;
  cargo: string;
  role: string;
}) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata
    }
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  
  if (error) {
    throw new Error(error.message);
  }
}

export async function getCurrentSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error) {
    throw new Error(error.message);
  }
  
  return session;
}

export async function getCurrentUser() {
  const session = await getCurrentSession();
  return session?.user || null;
}

// Admin operations through edge functions
export async function adminListUsers() {
  const session = await getCurrentSession();
  if (!session) {
    throw new Error('No authenticated session');
  }

  const functionUrl = new URL('/functions/v1/admin-users', import.meta.env.VITE_SUPABASE_URL).toString();
  
  const response = await fetch(functionUrl, {
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch users');
  }

  return response.json();
}

export async function adminCreateUser(userData: {
  email: string;
  password: string;
  metadata: any;
}) {
  const session = await getCurrentSession();
  if (!session) {
    throw new Error('No authenticated session');
  }

  const functionUrl = new URL('/functions/v1/admin-users', import.meta.env.VITE_SUPABASE_URL).toString();

  const response = await fetch(functionUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create user');
  }

  return response.json();
}

export async function adminUpdateUser(userId: string, profileData: any, email?: string) {
  const session = await getCurrentSession();
  if (!session) {
    throw new Error('No authenticated session');
  }

  const functionUrl = new URL(`/functions/v1/admin-users/${userId}`, import.meta.env.VITE_SUPABASE_URL).toString();

  const response = await fetch(functionUrl, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      profile_data: profileData,
      email: email
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update user');
  }

  return response.json();
}

export async function adminDeleteUser(userId: string) {
  const session = await getCurrentSession();
  if (!session) {
    throw new Error('No authenticated session');
  }

  const functionUrl = new URL(`/functions/v1/admin-users/${userId}`, import.meta.env.VITE_SUPABASE_URL).toString();

  const response = await fetch(functionUrl, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete user');
  }

  return response.json();
}

export async function updatePassword(newPassword: string) {
  const { error } = await supabase.auth.updateUser({
    password: newPassword
  });

  if (error) {
    throw new Error(error.message);
  }
}