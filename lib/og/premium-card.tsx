import { ImageResponse } from 'next/og';
import { BRAND_NAME, BRAND_TAGLINE } from '@/lib/brand';
import type { OgFonts } from '@/lib/og/fonts';
import { OG_IMAGE_SIZE } from '@/lib/og/size';

const PLUM = '#5B2850';
const PLUM_DEEP = '#3A1836';
const CREAM = '#FAF5F4';
const GOLD = '#D4AF7A';
const MUTED = '#8A6A80';

export type PremiumOgCardInput = {
  title: string;
  kicker?: string;
  price?: string;
  originalPrice?: string;
  footer?: string;
  photo?: string | null;
  logo?: string | null;
  fonts?: OgFonts | null;
};

function truncate(text: string, max: number): string {
  const trimmed = text.replace(/\s+/g, ' ').trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1).trimEnd()}…`;
}

export function renderPremiumOgCard({
  title,
  kicker,
  price,
  originalPrice,
  footer = `${BRAND_TAGLINE} · Uganda`,
  photo,
  logo,
  fonts,
}: PremiumOgCardInput): ImageResponse {
  const displayTitle = truncate(title, 58);
  const titleSize = displayTitle.length > 36 ? 42 : displayTitle.length > 22 ? 48 : 56;

  return new ImageResponse(
    (
      <div
        style={{
          width: OG_IMAGE_SIZE.width,
          height: OG_IMAGE_SIZE.height,
          display: 'flex',
          background: PLUM_DEEP,
          padding: 22,
        }}
      >
        <div
          style={{
            flex: 1,
            display: 'flex',
            background: CREAM,
            borderRadius: 28,
            overflow: 'hidden',
            border: `1px solid ${GOLD}`,
          }}
        >
          <div
            style={{
              width: 620,
              height: 586,
              display: 'flex',
              position: 'relative',
              background: `linear-gradient(160deg, ${PLUM} 0%, ${PLUM_DEEP} 100%)`,
            }}
          >
            {photo ? (
              <img
                src={photo}
                width={620}
                height={586}
                alt=""
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  width: 620,
                  height: 586,
                  objectFit: 'cover',
                  objectPosition: 'center',
                }}
              />
            ) : logo ? (
              <div
                style={{
                  width: 620,
                  height: 586,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <img
                  src={logo}
                  width={180}
                  height={180}
                  alt=""
                  style={{ width: 180, height: 180, borderRadius: 36 }}
                />
              </div>
            ) : null}
            <div
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: 0,
                height: 160,
                display: 'flex',
                background: 'linear-gradient(to top, rgba(58,24,54,0.45), transparent)',
              }}
            />
          </div>

          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              padding: '44px 48px 40px',
              background: CREAM,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {logo ? (
                <img
                  src={logo}
                  width={52}
                  height={52}
                  alt=""
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 14,
                    marginRight: 14,
                  }}
                />
              ) : null}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'baseline' }}>
                  <span
                    style={{
                      fontFamily: 'Playfair Display',
                      fontSize: 28,
                      fontStyle: 'italic',
                      fontWeight: 600,
                      color: PLUM,
                      lineHeight: 1,
                    }}
                  >
                    Shi
                  </span>
                  <span
                    style={{
                      fontFamily: 'Playfair Display',
                      fontSize: 32,
                      fontWeight: 700,
                      color: PLUM,
                      lineHeight: 1,
                    }}
                  >
                    Queen
                  </span>
                </div>
                <div
                  style={{
                    marginTop: 8,
                    width: 120,
                    height: 2,
                    background: `linear-gradient(to right, ${PLUM}40, ${GOLD}, ${PLUM}40)`,
                    borderRadius: 2,
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {kicker ? (
                <div
                  style={{
                    fontFamily: 'Work Sans',
                    fontSize: 14,
                    fontWeight: 500,
                    letterSpacing: 3.2,
                    textTransform: 'uppercase',
                    color: GOLD,
                    marginBottom: 14,
                  }}
                >
                  {kicker}
                </div>
              ) : null}
              <div
                style={{
                  fontFamily: 'Playfair Display',
                  fontSize: titleSize,
                  fontWeight: 700,
                  color: PLUM_DEEP,
                  lineHeight: 1.15,
                  letterSpacing: -0.6,
                }}
              >
                {displayTitle}
              </div>
              {price ? (
                <div style={{ display: 'flex', alignItems: 'baseline', marginTop: 22 }}>
                  <span
                    style={{
                      fontFamily: 'Work Sans',
                      fontSize: 34,
                      fontWeight: 500,
                      color: PLUM,
                    }}
                  >
                    {price}
                  </span>
                  {originalPrice ? (
                    <span
                      style={{
                        fontFamily: 'Work Sans',
                        fontSize: 18,
                        color: MUTED,
                        marginLeft: 12,
                        textDecoration: 'line-through',
                      }}
                    >
                      {originalPrice}
                    </span>
                  ) : null}
                </div>
              ) : null}
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span
                style={{
                  fontFamily: 'Work Sans',
                  fontSize: 15,
                  fontWeight: 500,
                  letterSpacing: 1.6,
                  textTransform: 'uppercase',
                  color: MUTED,
                }}
              >
                {footer}
              </span>
              <span
                style={{
                  fontFamily: 'Work Sans',
                  fontSize: 15,
                  fontWeight: 500,
                  color: PLUM,
                  letterSpacing: 0.4,
                }}
              >
                Shop now →
              </span>
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...OG_IMAGE_SIZE,
      headers: {
        'Cache-Control': 'public, max-age=3600, s-maxage=86400',
      },
      fonts: fonts
        ? [
            {
              name: 'Playfair Display',
              data: fonts.playfair,
              weight: 700,
              style: 'normal',
            },
            {
              name: 'Playfair Display',
              data: fonts.playfairItalic,
              weight: 600,
              style: 'italic',
            },
            {
              name: 'Work Sans',
              data: fonts.sans,
              weight: 500,
              style: 'normal',
            },
          ]
        : undefined,
    }
  );
}

export function renderFallbackOgCard(fonts?: OgFonts | null, logo?: string | null) {
  return renderPremiumOgCard({
    title: BRAND_NAME,
    kicker: 'Online boutique',
    footer: BRAND_TAGLINE,
    fonts,
    logo,
  });
}
