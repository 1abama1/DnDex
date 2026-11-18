export function errorKey(error: unknown): string {
  if (error instanceof Error && error.message.startsWith('errors.')) return error.message;
  const code =
    typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : '';
  const message =
    error instanceof Error
      ? error.message
      : typeof error === 'object' && error !== null && 'message' in error
        ? String(error.message)
        : '';
  if (code === 'invalid_credentials') return 'errors.credentials';
  if (code === 'email_not_confirmed') return 'errors.emailConfirmation';
  if (code === 'weak_password') return 'auth.passwordMin';
  if (code === 'user_already_exists' || code === 'email_exists') return 'errors.accountExists';
  if (code === '23505') return 'errors.duplicate';
  if (code === '42501' || code === 'PGRST301') return 'errors.permission';
  if (code === '23514' || message.includes('campaign_full') || message.includes('campaign_closed'))
    return 'errors.rules';
  if (code === 'over_request_rate_limit' || code === 'over_email_send_rate_limit')
    return 'errors.rateLimit';
  if (/fetch|network|timeout|offline/i.test(message)) return 'errors.network';
  return 'errors.generic';
}
