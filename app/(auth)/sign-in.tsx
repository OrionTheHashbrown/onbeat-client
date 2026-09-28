/**
 * Sign in page - app/(auth)/sign-in.tsx
 *
 * REFERENCE FROM
 * https://supabase.com/docs/reference/javascript/auth-signinwithpassword
 */

import { useRef, useState } from 'react';
import { TextInput } from 'react-native';

import { AuthHeader } from '../../components/auth/auth-header';
import { AuthPage } from '../../components/auth/auth-page';
import { FormError } from '../../components/auth/form-error';
import { SwitchPageLink } from '../../components/auth/switch-page-link';
import { TextField } from '../../components/auth/text-field';
import { Button } from '../../components/ui/button';
import { checkEmail } from '../../lib/auth-checks';
import { getErrorMessage } from '../../lib/errors';
import { supabase } from '../../lib/supabase';

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);

  const passwordInput = useRef<TextInput>(null);

  async function handleSignInButton() {
    setFormError(null);

    // CHECK the fields first
    const emailIssue = checkEmail(email);
    const passwordIssue = password.length === 0 ? 'Please enter your password' : null;
    setEmailError(emailIssue);
    setPasswordError(passwordIssue);

    if (emailIssue || passwordIssue) {
      return;
    }

    setIsSigningIn(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) {
        setFormError(error.message);
      }
    } catch (error) {
      setFormError(getErrorMessage(error));
    }
    setIsSigningIn(false);
  }

  return (
    <AuthPage
      footer={
        <SwitchPageLink question="Don't have an account?" linkText="Sign up" goTo="/sign-up" />
      }
    >
      <AuthHeader subtitle="Welcome back! Sign in to keep running on beat." />

      <TextField
        label="Email"
        placeholder="me@xyz.com"
        value={email}
        onChangeText={setEmail}
        errorText={emailError}
        keyboardType="email-address"
        textContentType="emailAddress"
        autoComplete="email"
        returnKeyType="next"
        onSubmitEditing={() => passwordInput.current?.focus()}
      />

      <TextField
        label="Password"
        placeholder="Your password"
        value={password}
        onChangeText={setPassword}
        errorText={passwordError}
        isPassword
        inputRef={passwordInput}
        textContentType="password"
        autoComplete="current-password"
        returnKeyType="go"
        onSubmitEditing={handleSignInButton}
      />

      <FormError message={formError} />

      <Button label="Sign in" onPress={handleSignInButton} isLoading={isSigningIn} />
    </AuthPage>
  );
}
