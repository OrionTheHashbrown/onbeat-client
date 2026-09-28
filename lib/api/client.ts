/**
 * To talk to our backend that is hosted in Railway – Fastify API Server (lib/api/client.ts).
 *
 * REFERENCE FROM
 * https://reactnative.dev/docs/network
 * https://supabase.com/docs/reference/javascript/auth-getsession
 */

import { supabase } from '../supabase';

const baseUrlFromEnv = process.env.EXPO_PUBLIC_API_BASE_URL;

if (!baseUrlFromEnv) {
  throw new Error('EXPO_PUBLIC_API_BASE_URL is MISSING from .env.local');
}

// REMOVE any slash at the end
let cleanBaseUrl = baseUrlFromEnv;
while (cleanBaseUrl.endsWith('/')) {
  cleanBaseUrl = cleanBaseUrl.slice(0, -1);
}
const apiBaseUrl = cleanBaseUrl;

export class ApiError extends Error {
  status: number;
  code: string | null;

  constructor(status: number, message: string, code: string | null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

// SEND a request to our backend and RETURN the JSON it sends back
export async function apiFetch<Result>(path: string, options: RequestInit = {}): Promise<Result> {

  // GET the token fresh EVERY time (supabase refreshes it in the background)
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  if (!token) {
    throw new Error('No token found. Please sign in again.');
  }

  const headers: Record<string, string> = { Authorization: 'Bearer ' + token };
  if (options.body) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(apiBaseUrl + path, {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.warn('[api] ' + response.status + ' from OnBeat API:', errorText);
    throw buildApiError(response.status, errorText);
  }

  return (await response.json()) as Result;
}

function buildApiError(status: number, errorText: string): ApiError {

  // READ the server's { error, message } body (if it sent one)
  let serverMessage: string | null = null;
  let serverCode: string | null = null;
  try {
    const body = JSON.parse(errorText);
    if (typeof body.message === 'string') {
      serverMessage = body.message;
    }
    if (typeof body.error === 'string') {
      serverCode = body.error;
    }
  } catch {
    // Nothing as nothing to parse
  }

  // SELECT a friendly error message for most common errors
  let message = 'OnBeat API returned ' + status + '.';
  if (status === 401) {
    message = 'Your OnBeat session expired. Please sign in again.';
  } else if (status === 429) {
    message = 'Too many requests to the OnBeat API. Try again in a minute.';
  } else if (status === 503) {
    message = 'OnBeat could not reach the database. Try again shortly.';
  } else if (serverMessage) {
    message = 'OnBeat API returned ' + status + ': ' + serverMessage;
  }

  return new ApiError(status, message, serverCode);
}
