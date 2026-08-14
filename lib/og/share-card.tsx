import { ImageResponse } from 'next/og';
import { BRAND_NAME, BRAND_TAGLINE, BRAND_THEME } from '@/lib/brand';
import { getOgFonts } from '@/lib/og/fonts';
import { CACHE_CONTROL } from '@/lib/og/serve-image';
import { OG_HEIGHT, OG_WIDTH } from '@/lib/og/size';

type ShareCardProps = {
  photoSrc: string | null;
  title?: string;
  eyebrow?: string;
};

export async function renderShareCard({
  photoSrc,
  title,
  eyebrow,
}: ShareCardProps): Promise<ImageResponse> {
  const fonts = await getOgFonts();
  const serif = fonts.some((font) => font.name === 'Playfair Display')
    ? 'Playfair Display'
    : 'Georgia';
  const sans = fonts.some((font) => font.name === 'Figtree') ? 'Figtree' : 'sans-serif';

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          width: OG_WIDTH,
          height: OG_HEIGHT,
          position: 'relative',
          backgroundColor: BRAND_THEME.themeColor,
          overflow: 'hidden',
        }}
      >
        {photoSrc ? (
          <img
            src={photoSrc}
            alt=""
            width={OG_WIDTH}
            height={OG_HEIGHT}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: OG_WIDTH,
              height: OG_HEIGHT,
              objectFit: 'cover',
              objectPosition: 'center',
            }}
          />
        ) : (
          <div
            style={{
              display: 'flex',
              position: 'absolute',
              top: 0,
              left: 0,
              width: OG_WIDTH,
              height: OG_HEIGHT,
              background: `linear-gradient(135deg, ${BRAND_THEME.themeColor} 0%, #8A4A7A 55%, ${BRAND_THEME.backgroundColor} 100%)`,
            }}
          />
        )}

        <div
          style={{
            display: 'flex',
            position: 'absolute',
            top: 0,
            left: 0,
            width: OG_WIDTH,
            height: OG_HEIGHT,
            background:
              'linear-gradient(180deg, rgba(45, 18, 40, 0.18) 0%, rgba(45, 18, 40, 0.04) 38%, rgba(45, 18, 40, 0.55) 100%)',
          }}
        />

        <div
          style={{
            display: 'flex',
            position: 'absolute',
            top: 22,
            left: 22,
            width: OG_WIDTH - 44,
            height: OG_HEIGHT - 44,
            border: '1px solid rgba(245, 230, 200, 0.42)',
          }}
        />

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            position: 'absolute',
            top: 40,
            left: 44,
            backgroundColor: 'rgba(250, 245, 244, 0.94)',
            borderRadius: 999,
            padding: '12px 22px',
          }}
        >
          <div
            style={{
              display: 'flex',
              fontFamily: serif,
              fontSize: 30,
              fontWeight: 700,
              color: BRAND_THEME.themeColor,
              letterSpacing: -0.4,
            }}
          >
            {BRAND_NAME}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            position: 'absolute',
            left: 44,
            right: 44,
            bottom: 42,
          }}
        >
          {eyebrow ? (
            <div
              style={{
                display: 'flex',
                fontFamily: sans,
                fontSize: 18,
                fontWeight: 600,
                color: 'rgba(245, 230, 200, 0.92)',
                letterSpacing: 3.2,
                textTransform: 'uppercase',
                marginBottom: 8,
              }}
            >
              {eyebrow}
            </div>
          ) : null}
          {title ? (
            <div
              style={{
                display: 'flex',
                fontFamily: serif,
                fontSize: title.length > 42 ? 42 : 52,
                fontWeight: 700,
                color: '#FAF5F4',
                lineHeight: 1.12,
                letterSpacing: -0.8,
                maxWidth: 980,
              }}
            >
              {title.length > 70 ? `${title.slice(0, 67).trimEnd()}…` : title}
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                fontFamily: sans,
                fontSize: 18,
                fontWeight: 600,
                color: 'rgba(250, 245, 244, 0.88)',
                letterSpacing: 2.4,
                textTransform: 'uppercase',
              }}
            >
              {BRAND_TAGLINE}
            </div>
          )}
        </div>

        <div
          style={{
            display: 'flex',
            position: 'absolute',
            left: 0,
            bottom: 0,
            width: OG_WIDTH,
            height: 7,
            background: 'linear-gradient(90deg, #C9A36A 0%, #F5E6C8 50%, #C9A36A 100%)',
          }}
        />
      </div>
    ),
    {
      width: OG_WIDTH,
      height: OG_HEIGHT,
      fonts,
      headers: {
        'Cache-Control': CACHE_CONTROL,
      },
    }
  );
}
