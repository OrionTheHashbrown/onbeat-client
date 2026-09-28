/**
 * Manages the user's authentication session – supabase session
 * 
 * REFERENCE FROM
 * https://supabase.com/docs/guides/getting-started/tutorials/with-expo-react-native
 * https://docs.expo.dev/router/advanced/authentication/
 */

import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from './supabase';

export type SessionState = 'loading' | 'signed-out' | User;

const SessionContext = createContext<SessionState>('loading');

export function SessionProvider({ children }: { children: ReactNode }) {
  const [sessionState, setSessionState] = useState<SessionState>('loading');

  useEffect(() => {

    // GET current session from Supabase if any
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setSessionState(data.session.user);
      } else {
        setSessionState('signed-out');
      }
    });

    // LISTEN for sign in / sign out / token refresh from now on
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setSessionState(session.user);
      } else {
        setSessionState('signed-out');
      }
    });

    // STOP listening when the provider goes away
    return () => {
      data.subscription.unsubscribe();
    };
  }, []);

  return <SessionContext.Provider value={sessionState}>{children}</SessionContext.Provider>;
}

export function useSession() {
  return useContext(SessionContext);
}

// GET the signed in user, ONLY to be used in signed in parts of the app
export function useSignedInUser(): User {
  const sessionState = useSession();
  if (sessionState === 'loading' || sessionState === 'signed-out') {
    throw new Error('useSignedInUser was used outside of the signed in part of the app');
  }
  return sessionState;
}

// GET the name the user typed in on sign up 
export function getDisplayName(user: User): string {
  const savedName = user.user_metadata?.name;
  if (typeof savedName === 'string' && savedName.length > 0) {
    return savedName;
  }
  if (user.email) {
    return user.email.split('@')[0];
  }
  return 'Runner';
}
