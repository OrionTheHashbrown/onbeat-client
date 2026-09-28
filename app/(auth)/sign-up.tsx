/**
 * SIGN UP PAGE – app/(auth)/sign-up.tsx
 *
 * REFERENCE FROM
 * https://supabase.com/docs/reference/javascript/auth-signup
 */

import { useRef, useState } from 'react';
import { TextInput } from 'react-native';
import { AuthHeader } from '../../components/auth/auth-header';
import { AuthPage } from '../../components/auth/auth-page';
import { FormError } from '../../components/auth/form-error';
import { SwitchPageLink } from '../../components/auth/switch-page-link';
import { TextField } from '../../components/auth/text-field';
import { Button } from '../../components/ui/button';
import { checkEmail, checkName, checkPassword, checkPasswordsMatch } from '../../lib/auth-checks';
import { getErrorMessage } from '../../lib/errors';
import { supabase } from '../../lib/supabase';

export default function SignUpScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [nameError, setNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const [isSigningUp, setIsSigningUp] = useState(false);

  const emailInput = useRef<TextInput>(null);
  const passwordInput = useRef<TextInput>(null);
  const confirmInput = useRef<TextInput>(null);

  // CHECK every field and show any errors if any
  function checkAllFields(): boolean {
    const nameProblem = checkName(name);
    const emailProblem = checkEmail(email);
    const passwordProblem = checkPassword(password);
    const confirmProblem = checkPasswordsMatch(password, confirmPassword);

    setNameError(nameProblem);
    setEmailError(emailProblem);
    setPasswordError(passwordProblem);
    setConfirmError(confirmProblem);

    return !nameProblem && !emailProblem && !passwordProblem && !confirmProblem;
  }

  async function handleSignUpButton() {
    setFormError(null);

    if (!checkAllFields()) {
      return;
    }

    setIsSigningUp(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { name: name.trim() } },
      });

      // CHECK if the email is already taken, and tell user to sign in instead
      if (error && error.code === 'user_already_exists') {
        setFormError('That email already has an account. Try signing in instead.');
      } else if (error) {
        setFormError(error.message);
      }
    } catch (error) {
      setFormError(getErrorMessage(error));
    }
    setIsSigningUp(false);
  }

  const signInLink = (
    <SwitchPageLink question="Already have an account?" linkText="Sign in" goTo="/sign-in" />
  );

  return (
    <AuthPage footer={signInLink}>
      <AuthHeader subtitle="Create an account with us!" />

      <TextField
        label="Name"
        placeholder="What's your name?"
        value={name}
        onChangeText={setName}
        errorText={nameError}
        autoCapitalize="words"
        textContentType="name"
        autoComplete="name"
        returnKeyType="next"
        onSubmitEditing={() => emailInput.current?.focus()}
      />

      <TextField
        label="Email"
        placeholder="me@xyz.com"
        value={email}
        onChangeText={setEmail}
        errorText={emailError}
        inputRef={emailInput}
        keyboardType="email-address"
        textContentType="emailAddress"
        autoComplete="email"
        returnKeyType="next"
        onSubmitEditing={() => passwordInput.current?.focus()}
      />

      <TextField
        label="Password"
        placeholder="At least 6 characters"
        value={password}
        onChangeText={setPassword}
        errorText={passwordError}
        isPassword
        inputRef={passwordInput}
        textContentType="newPassword"
        autoComplete="new-password"
        returnKeyType="next"
        onSubmitEditing={() => confirmInput.current?.focus()}
      />

      <TextField
        label="Confirm password"
        placeholder="Confirm your password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        errorText={confirmError}
        isPassword
        inputRef={confirmInput}
        textContentType="newPassword"
        autoComplete="new-password"
        returnKeyType="go"
        onSubmitEditing={handleSignUpButton}
      />

      <FormError message={formError} />

      <Button label="Create account" onPress={handleSignUpButton} isLoading={isSigningUp} />
    </AuthPage>
  );
}
