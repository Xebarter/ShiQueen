export function getAuthErrorMessage(error: unknown): string {
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code: string }).code)
      : '';

  switch (code) {
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/invalid-phone-number':
    case 'auth/missing-phone-number':
      return 'Enter a valid Uganda mobile number, like 07XX XXX XXX.';
    case 'auth/invalid-verification-code':
    case 'auth/invalid-verification-id':
    case 'auth/missing-verification-code':
      return 'That code is incorrect. Check the SMS and try again.';
    case 'auth/code-expired':
    case 'auth/session-expired':
      return 'That code expired. Request a new one.';
    case 'auth/captcha-check-failed':
    case 'auth/invalid-app-credential':
      return 'Phone verification could not start on this site. Try Google or email.';
    case 'auth/quota-exceeded':
      return 'SMS limit reached. Try again later or use another sign-in method.';
    case 'auth/operation-not-allowed': {
      const message =
        typeof error === 'object' && error !== null && 'message' in error
          ? String((error as { message: string }).message)
          : '';
      if (/region/i.test(message)) {
        return 'SMS is not enabled for Uganda yet. Use Google or email, or ask the store to turn on phone sign-in.';
      }
      return 'Phone sign-in is not enabled yet. Try Google or email.';
    }
    case 'auth/user-disabled':
      return 'This account has been disabled. Contact support for help.';
    case 'invalid_credentials':
    case 'email_not_confirmed':
      return 'Incorrect email or password. Please try again.';
    case 'email_exists':
      return 'An account with this email already exists. Try signing in instead.';
    case 'weak_password':
      return 'Password must be at least 6 characters.';
    case 'auth/popup-closed-by-user':
      return 'Google sign-in was cancelled.';
    case 'auth/popup-blocked':
      return 'Pop-up was blocked. Allow pop-ups for this site and try again.';
    case 'auth/account-exists-with-different-credential':
      return 'An account already exists with this email using a different sign-in method.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a moment and try again.';
    case 'auth/network-request-failed':
      return 'Network error. Check your connection and try again.';
    case 'auth/argument-error':
      return 'Google sign-in is not configured correctly. Refresh the page and try again.';
    default:
      return 'Something went wrong. Please try again.';
  }
}
