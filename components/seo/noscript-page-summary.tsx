import { getPublicCrawlLinks } from '@/lib/seo/public-nav';
import { getFeatureFlags } from '@/lib/supabase/feature-flags-server';

type Link = { href: string; label: string };

export async function NoscriptPageSummary({
  title,
  description,
  links,
}: {
  title: string;
  description: string;
  links?: readonly Link[];
}) {
  const resolvedLinks = links ?? getPublicCrawlLinks(await getFeatureFlags());

  return (
    <noscript>
      <article>
        <h1>{title}</h1>
        <p>{description}</p>
        {resolvedLinks.length > 0 ? (
          <nav aria-label="ShiQueen">
            <ul>
              {resolvedLinks.map((link) => (
                <li key={link.href}>
                  <a href={link.href}>{link.label}</a>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}
      </article>
    </noscript>
  );
}

