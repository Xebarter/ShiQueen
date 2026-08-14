type OgFont = { name: string; data: ArrayBuffer; weight: 400 | 600 | 700; style: 'normal' | 'italic' };

let cached: OgFont[] | null = null;

async function loadFontFile(cssUrl: string): Promise<ArrayBuffer | null> {
  try {
    const css = await fetch(cssUrl, {
      headers: {
        // Older UA so Google returns TTF/WOFF instead of WOFF2 (Satori cannot use WOFF2).
        'User-Agent':
          'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:40.0) Gecko/20100101 Firefox/40.0',
      },
    });
    if (!css.ok) return null;
    const text = await css.text();
    const match = text.match(/src: url\(([^)]+)\)/);
    if (!match?.[1]) return null;
    const file = await fetch(match[1]);
    if (!file.ok) return null;
    return file.arrayBuffer();
  } catch {
    return null;
  }
}

export async function getOgFonts(): Promise<OgFont[]> {
  if (cached) return cached;

  const [serif, sans] = await Promise.all([
    loadFontFile('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700'),
    loadFontFile('https://fonts.googleapis.com/css2?family=Figtree:wght@600'),
  ]);

  const fonts: OgFont[] = [];
  if (serif) {
    fonts.push({ name: 'Playfair Display', data: serif, weight: 700, style: 'normal' });
  }
  if (sans) {
    fonts.push({ name: 'Figtree', data: sans, weight: 600, style: 'normal' });
  }

  cached = fonts;
  return fonts;
}
