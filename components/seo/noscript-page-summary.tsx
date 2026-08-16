import { PUBLIC_CRAWL_LINKS } from '@/lib/seo/public-nav';

type Link = { href: string; label: string };

export function NoscriptPageSummary({
  title,
  description,
  links = [...PUBLIC_CRAWL_LINKS],
}: {
  title: string;
  description: string;
  links?: readonly Link[];
}) {
  return (
    <noscript>
      <article>
        <h1>{title}</h1>
        <p>{description}</p>
        {links.length > 0 ? (
          <nav aria-label="ShiQueen">
            <ul>
              {links.map((link) => (
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
