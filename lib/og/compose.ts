import sharp from 'sharp';
import { BRAND_NAME, BRAND_THEME } from '@/lib/brand';
import { OG_HEIGHT, OG_WIDTH } from '@/lib/og/size';

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function overlaySvg(title?: string, eyebrow?: string): Buffer {
  const label = title
    ? escapeXml(title.length > 48 ? `${title.slice(0, 45).trimEnd()}…` : title)
    : '';
  const category = eyebrow ? escapeXml(eyebrow.toUpperCase()) : '';

  return Buffer.from(`<svg width="${OG_WIDTH}" height="${OG_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#2d1228" stop-opacity="0.16"/>
      <stop offset="42%" stop-color="#2d1228" stop-opacity="0"/>
      <stop offset="100%" stop-color="#2d1228" stop-opacity="0.58"/>
    </linearGradient>
  </defs>
  <rect width="${OG_WIDTH}" height="${OG_HEIGHT}" fill="url(#g)"/>
  <rect x="22" y="22" width="${OG_WIDTH - 44}" height="${OG_HEIGHT - 44}" fill="none" stroke="rgba(245,230,200,0.42)" stroke-width="1"/>
  <rect x="44" y="40" rx="28" ry="28" width="196" height="52" fill="rgb(250,245,244)"/>
  <text x="142" y="74" text-anchor="middle" font-size="26" font-weight="700" font-family="Georgia, Times New Roman, serif" fill="${BRAND_THEME.themeColor}">${BRAND_NAME}</text>
  ${category ? `<text x="48" y="538" font-size="18" font-weight="600" font-family="Arial, Helvetica, sans-serif" fill="#F5E6C8" letter-spacing="3.2">${category}</text>` : ''}
  ${label ? `<text x="48" y="592" font-size="${label.length > 36 ? 36 : 44}" font-weight="700" font-family="Georgia, Times New Roman, serif" fill="#FAF5F4">${label}</text>` : ''}
  <rect x="0" y="623" width="${OG_WIDTH}" height="7" fill="#C9A36A"/>
</svg>`);
}

async function jpegUnderLimit(pipeline: sharp.Sharp, maxBytes = 280_000): Promise<Buffer> {
  for (const quality of [82, 74, 66, 58]) {
    try {
      const buffer = await pipeline.clone().jpeg({ quality, mozjpeg: true }).toBuffer();
      if (buffer.byteLength <= maxBytes) return buffer;
    } catch {
      const buffer = await pipeline.clone().jpeg({ quality }).toBuffer();
      if (buffer.byteLength <= maxBytes) return buffer;
    }
  }
  return pipeline.jpeg({ quality: 52 }).toBuffer();
}

export async function composeShareJpeg(options: {
  photo?: Buffer | null;
  title?: string;
  eyebrow?: string;
}): Promise<Buffer> {
  const overlay = overlaySvg(options.title, options.eyebrow);
  const base = options.photo
    ? sharp(options.photo).rotate().resize(OG_WIDTH, OG_HEIGHT, {
        fit: 'cover',
        position: 'centre',
      })
    : sharp({
        create: {
          width: OG_WIDTH,
          height: OG_HEIGHT,
          channels: 3,
          background: BRAND_THEME.themeColor,
        },
      });

  return jpegUnderLimit(
    base.composite([{ input: overlay, blend: 'over' }])
  );
}
