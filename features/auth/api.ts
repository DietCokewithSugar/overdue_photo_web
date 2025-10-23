import { apiFetch } from '@/lib/api';

interface SignUpPayload {
  email: string;
  password: string;
  displayName: string;
}

interface SignInPayload {
  email: string;
  password: string;
}

interface AuthResponse {
  requiresEmailConfirmation?: boolean;
}

export const signUp = async (payload: SignUpPayload) =>
  apiFetch<AuthResponse>('/api/auth/sign-up', {
    method: 'POST',
    json: payload
  });

export const signIn = async (payload: SignInPayload) =>
  apiFetch<AuthResponse>('/api/auth/sign-in', {
    method: 'POST',
    json: payload
  });

export const signOut = async () =>
  apiFetch<void>('/api/auth/sign-out', {
    method: 'POST'
  });
