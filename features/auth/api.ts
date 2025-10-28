import { apiFetch } from '@/lib/api';

export interface SignUpPayload extends Record<string, unknown> {
  email: string;
  password: string;
  displayName: string;
}

export interface SignInPayload extends Record<string, unknown> {
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
