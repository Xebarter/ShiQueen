function normalizeSiteUrl(url: string): string {
  return url.replace(/\/+$/, '');
}

export function getSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) {
    return normalizeSiteUrl(configured);
  }

  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (vercelUrl) {
    return normalizeSiteUrl(`https://${vercelUrl}`);
  }

  return 'http://localhost:3000';
}

export function toAbsoluteUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${getSiteUrl()}${normalizedPath}`;
}
