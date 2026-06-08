function trimTrailingSlash(url: string): string {
  return url.replace(/\/+$/, '');
}

export function getAppBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return trimTrailingSlash(process.env.NEXT_PUBLIC_APP_URL);
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return 'http://localhost:3000';
}

export function getPaytotaConfig() {
  const baseUrl = trimTrailingSlash(process.env.PAYTOTA_BASE_URL ?? 'https://gate.paytota.com');
  const secretKey = process.env.PAYTOTA_SECRET_KEY;
  const brandId = process.env.PAYTOTA_BRAND_ID;
  const appBaseUrl = getAppBaseUrl();

  if (!secretKey || !brandId) {
    throw new Error('Paytota is not configured. Set PAYTOTA_SECRET_KEY and PAYTOTA_BRAND_ID.');
  }

  return {
    baseUrl,
    secretKey,
    brandId,
    env: process.env.PAYTOTA_ENV ?? 'live',
    webhookPublicKey: (process.env.PAYTOTA_WEBHOOK_PUBLIC_KEY ?? '').replace(/\\n/g, '\n').trim(),
    publicKeyUrl: process.env.PAYTOTA_PUBLIC_KEY_URL ?? `${baseUrl}/api/v1/public_key/`,
    successRedirect:
      process.env.PAYTOTA_SUCCESS_REDIRECT ?? `${appBaseUrl}/payments/success`,
    failureRedirect:
      process.env.PAYTOTA_FAILURE_REDIRECT ?? `${appBaseUrl}/payments/failure`,
    cancelRedirect:
      process.env.PAYTOTA_CANCEL_REDIRECT ?? `${appBaseUrl}/payments/cancel`,
  };
}
