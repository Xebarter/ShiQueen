import sharp from 'sharp';
import { BRAND_NAME, BRAND_THEME } from '@/lib/brand';
import { OG_HEIGHT, OG_WIDTH } from '@/lib/og/size';

const OG_JPEG_LIMIT = 300_000;
const GOLD = '#C9A36A';
const CREAM = '#FAF5F4';
const BLUSH = '#F5E6C8';

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function chromeOverlay(): Buffer {
  return Buffer.from(`<svg width="${OG_WIDTH}" height="${OG_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <rect x="32" y="26" rx="22" ry="22" width="172" height="44" fill="${CREAM}"/>
  <text x="118" y="55" text-anchor="middle" font-size="22" font-weight="700" font-family="Georgia, Times New Roman, serif" fill="${BRAND_THEME.themeColor}">${BRAND_NAME}</text>
  <rect x="0" y="${OG_HEIGHT - 6}" width="${OG_WIDTH}" height="6" fill="${GOLD}"/>
</svg>`);
}

function fallbackOverlay(title?: string, eyebrow?: string): Buffer {
  const label = title
    ? escapeXml(title.length > 42 ? `${title.slice(0, 39).trimEnd()}…` : title)
    : escapeXml(BRAND_NAME);
  const category = eyebrow ? escapeXml(eyebrow.toUpperCase()) : '';
  const titleSize = label.length > 28 ? 34 : 44;

  return Buffer.from(`<svg width="${OG_WIDTH}" height="${OG_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#3d1a36"/>
      <stop offset="100%" stop-color="${BRAND_THEME.themeColor}"/>
    </linearGradient>
  </defs>
  <rect width="${OG_WIDTH}" height="${OG_HEIGHT}" fill="url(#bg)"/>
  <rect x="22" y="22" width="${OG_WIDTH - 44}" height="${OG_HEIGHT - 44}" fill="none" stroke="${GOLD}" stroke-opacity="0.5" stroke-width="1.5"/>
  <rect x="32" y="26" rx="22" ry="22" width="172" height="44" fill="${CREAM}"/>
  <text x="118" y="55" text-anchor="middle" font-size="22" font-weight="700" font-family="Georgia, Times New Roman, serif" fill="${BRAND_THEME.themeColor}">${BRAND_NAME}</text>
  ${category ? `<text x="600" y="268" text-anchor="middle" font-size="18" font-weight="600" font-family="Arial, Helvetica, sans-serif" fill="${BLUSH}" letter-spacing="4">${category}</text>` : ''}
  <text x="600" y="${category ? 338 : 320}" text-anchor="middle" font-size="${titleSize}" font-weight="700" font-family="Georgia, Times New Roman, serif" fill="${CREAM}">${label}</text>
  <rect x="0" y="${OG_HEIGHT - 6}" width="${OG_WIDTH}" height="6" fill="${GOLD}"/>
</svg>`);
}

async function encodeOgJpeg(pipeline: sharp.Sharp): Promise<Buffer> {
  const first = await pipeline.clone().jpeg({ quality: 74, chromaSubsampling: '4:2:0' }).toBuffer();
  if (first.byteLength <= OG_JPEG_LIMIT) return first;
  return pipeline.jpeg({ quality: 58, chromaSubsampling: '4:2:0' }).toBuffer();
}

async function composeProductPhoto(photo: Buffer): Promise<Buffer> {
  const filled = await sharp(photo, {
    failOn: 'none',
    sequentialRead: true,
    animated: false,
    limitInputPixels: 40_000_000,
  })
    .rotate()
    .resize(OG_WIDTH, OG_HEIGHT, {
      fit: 'cover',
      position: 'centre',
      kernel: 'cubic',
    })
    .toBuffer();

  return encodeOgJpeg(
    sharp(filled).composite([{ input: chromeOverlay(), blend: 'over' }])
  );
}

export async function composeShareJpeg(options: {
  photo?: Buffer | null;
  title?: string;
  eyebrow?: string;
}): Promise<Buffer> {
  if (options.photo && options.photo.byteLength > 0) {
    try {
      return await composeProductPhoto(options.photo);
    } catch {
      // Fall through to the branded card so crawlers still get a 1200×630 JPEG.
    }
  }

  const overlay = fallbackOverlay(options.title, options.eyebrow);
  const base = sharp({
    create: {
      width: OG_WIDTH,
      height: OG_HEIGHT,
      channels: 3,
      background: BRAND_THEME.themeColor,
    },
  });

  return encodeOgJpeg(base.composite([{ input: overlay, blend: 'over' }]));
}
