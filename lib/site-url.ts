function normalizeSiteUrl(url: string): string {
  return url.replace(/\/+$/, '');
}

function canonicalizeSiteUrl(url: string): string {
  try {
    const parsed = new URL(url);
    // Apex 308s to www; WhatsApp/Facebook skip OG images that redirect.
    if (parsed.hostname === 'shiqueen.com') {
      parsed.hostname = 'www.shiqueen.com';
    }
    return parsed.origin;
  } catch {
    return normalizeSiteUrl(url);
  }
}

export function getSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) {
    return canonicalizeSiteUrl(configured);
  }

  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (vercelUrl) {
    return canonicalizeSiteUrl(`https://${vercelUrl}`);
  }

  return 'http://localhost:3000';
}

export function toAbsoluteUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${getSiteUrl()}${normalizedPath}`;
}
