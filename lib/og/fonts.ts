const FONT_BASE = 'https://cdn.jsdelivr.net/fontsource/fonts';

const FONT_FILES = {
  playfair: `${FONT_BASE}/playfair-display@5.2.8/latin-700-normal.ttf`,
  playfairItalic: `${FONT_BASE}/playfair-display@5.2.8/latin-600-italic.ttf`,
  sans: `${FONT_BASE}/work-sans@5.2.8/latin-500-normal.ttf`,
} as const;

const cache = new Map<string, Promise<ArrayBuffer>>();

async function loadFont(url: string): Promise<ArrayBuffer> {
  const cached = cache.get(url);
  if (cached) return cached;

  const request = fetch(url).then((res) => {
    if (!res.ok) throw new Error(`Font ${res.status}: ${url}`);
    return res.arrayBuffer();
  });

  cache.set(url, request);
  return request;
}

export type OgFonts = {
  playfair: ArrayBuffer;
  playfairItalic: ArrayBuffer;
  sans: ArrayBuffer;
};

export async function loadOgFonts(_text?: string): Promise<OgFonts | null> {
  try {
    const [playfair, playfairItalic, sans] = await Promise.all([
      loadFont(FONT_FILES.playfair),
      loadFont(FONT_FILES.playfairItalic),
      loadFont(FONT_FILES.sans),
    ]);
    return { playfair, playfairItalic, sans };
  } catch (error) {
    console.warn('[ShiQueen] OG fonts failed, using fallbacks:', error);
    return null;
  }
}
