const minPasswordLength = 6;

export function checkName(name: string): string | null {
  if (name.trim().length === 0) {
    return 'Please enter your name';
  }
  return null;
}

export function checkEmail(email: string): string | null {
  const trimmedEmail = email.trim();

  if (trimmedEmail.length === 0) {
    return 'Please enter your email';
  }

  // CHECK IF it has a simple format like <abc>@<domain>.<tld> format
  const atPosition = trimmedEmail.indexOf('@');
  const lastDotPosition = trimmedEmail.lastIndexOf('.');
  const looksLikeEmail = atPosition > 0 && lastDotPosition > atPosition + 1 && lastDotPosition < trimmedEmail.length - 1;

  if (!looksLikeEmail) {
    return 'That does not look like an email';
  }
  return null;
}

export function checkPassword(password: string): string | null {
  if (password.length === 0) {
    return 'Please enter your password';
  }
  if (password.length < minPasswordLength) {
    return 'Password needs at least ' + minPasswordLength + ' characters';
  }
  return null;
}

export function checkPasswordsMatch(password: string, confirmPassword: string): string | null {
  if (confirmPassword.length === 0) {
    return 'Please type your password again';
  }
  if (password !== confirmPassword) {
    return 'Passwords do not match';
  }
  return null;
}
