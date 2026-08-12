import { Cookie } from 'lucide-react';
import {
  LEGAL_BUSINESS_ADDRESS,
  LEGAL_PRIVACY_EMAIL,
  LEGAL_SITE_LABEL,
  LEGAL_SITE_URL,
  LegalBulletList,
  LegalCallout,
  LegalContactCards,
  LegalPageShell,
  LegalRelatedLink,
  LegalSection,
  LegalSubHeading,
} from '@/components/legal/legal-page-shell';

const TOC = [
  { id: 'what-are-cookies', label: '1. What Are Cookies?' },
  { id: 'why-we-use', label: '2. Why Do We Use Cookies?' },
  { id: 'types', label: '3. Types of Cookies' },
  { id: 'session-persistent', label: '4. Session vs Persistent' },
  { id: 'third-party', label: '5. Third-Party Cookies' },
  { id: 'duration', label: '6. How Long Cookies Stay' },
  { id: 'managing', label: '7. Managing Cookies' },
  { id: 'disabling', label: '8. Impact of Disabling' },
  { id: 'personal-data', label: '9. Cookies and Personal Data' },
  { id: 'updates', label: '10. Updates to This Policy' },
  { id: 'contact', label: '11. Contact Us' },
] as const;

const DURATION_ROWS = [
  { type: 'Session cookies', duration: 'Until you close your browser' },
  { type: 'Essential / Functional', duration: 'From session up to 12 months' },
  { type: 'Analytics', duration: 'Usually 1–24 months' },
  {
    type: 'Advertising / Targeting',
    duration: 'Usually 1–12 months (sometimes longer)',
  },
] as const;

export function CookiePolicyPage() {
  return (
    <LegalPageShell
      badge="Legal"
      badgeIcon={Cookie}
      title="Cookie Policy"
      summary={
        <p>
          This Cookie Policy explains how SheQueen (“we,” “us,” or “our”) uses cookies and
          similar tracking technologies on{' '}
          <a
            href={LEGAL_SITE_URL}
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            {LEGAL_SITE_LABEL}
          </a>{' '}
          (the “Site”). It should be read together with our Privacy Policy and Terms of
          Service.
        </p>
      }
      relatedLinks={
        <>
          <LegalRelatedLink href="/privacy">Privacy Policy</LegalRelatedLink>
          <LegalRelatedLink href="/terms">Terms of Service</LegalRelatedLink>
          <LegalRelatedLink href="/contact">Contact</LegalRelatedLink>
        </>
      }
      toc={TOC}
    >
      <LegalCallout tone="primary">
        By continuing to use our Site, you consent to the use of cookies in accordance with
        this Cookie Policy (unless you have adjusted your browser settings or cookie
        preferences to refuse them).
      </LegalCallout>

      <LegalSection id="what-are-cookies" title="1. What Are Cookies?">
        <p>
          Cookies are small text files that are placed on your computer, smartphone, or other
          device when you visit a website. They are widely used to make websites work more
          efficiently, improve user experience, and provide information to website owners.
        </p>
        <p>We also use similar technologies such as:</p>
        <LegalBulletList
          items={[
            <>
              <span className="font-medium text-foreground">Web beacons / pixel tags</span> —
              small graphic images that help us understand how you interact with our Site and
              emails
            </>,
            <>
              <span className="font-medium text-foreground">Local storage</span> — technology
              that stores data in your browser
            </>,
            <>
              <span className="font-medium text-foreground">SDKs and tracking scripts</span> used
              by third-party services
            </>,
          ]}
        />
        <p>
          In this Policy, we refer to all these technologies collectively as “cookies.”
        </p>
      </LegalSection>

      <LegalSection id="why-we-use" title="2. Why Do We Use Cookies?">
        <p>We use cookies for the following purposes:</p>
        <LegalBulletList
          items={[
            'To enable essential Site functionality (e.g., shopping cart, checkout, account login)',
            'To remember your preferences and settings',
            'To understand how visitors use our Site so we can improve it',
            'To deliver relevant advertising and measure the effectiveness of our marketing campaigns',
            'To help detect and prevent fraud and enhance security',
            'To personalise your shopping experience (e.g., remembering items you viewed)',
          ]}
        />
      </LegalSection>

      <LegalSection id="types" title="3. Types of Cookies We Use">
        <p>We categorise cookies as follows:</p>

        <LegalSubHeading>3.1 Strictly Necessary (Essential) Cookies</LegalSubHeading>
        <p>
          These cookies are required for the Site to function properly. They enable core
          features such as:
        </p>
        <LegalBulletList
          items={[
            'Adding products to your shopping cart',
            'Proceeding through checkout',
            'Secure login and account access',
            'Remembering cookie consent preferences',
            'Security and fraud prevention',
          ]}
        />
        <p>
          These cookies do not require your consent. If you disable them, parts of the Site
          (especially shopping and account features) may not work.
        </p>

        <LegalSubHeading>3.2 Performance and Analytics Cookies</LegalSubHeading>
        <p>
          These cookies collect information about how visitors use the Site (e.g., which pages
          are visited most often, whether users receive error messages, time spent on pages).
          The information is aggregated and anonymous.
        </p>
        <p>
          We use this data to improve the performance, design, and usability of the Site.
          Examples of tools we may use include Google Analytics or similar analytics platforms.
        </p>

        <LegalSubHeading>3.3 Functional Cookies</LegalSubHeading>
        <p>
          These cookies allow the Site to remember choices you make (such as language
          preference, region, or previously viewed products) and provide enhanced, more
          personalised features.
        </p>
        <p>
          They may also be used to provide services you have requested, such as watching a
          video or leaving a product review.
        </p>

        <LegalSubHeading>3.4 Targeting / Advertising Cookies</LegalSubHeading>
        <p>
          These cookies are used to deliver advertisements that are more relevant to you and
          your interests. They are also used to limit the number of times you see an
          advertisement and help measure the effectiveness of advertising campaigns.
        </p>
        <p>
          These cookies may be placed by us or by third-party advertising partners (such as
          Meta/Facebook, Google Ads, or other advertising networks). They remember that you
          have visited our Site and may share this information with other organisations such as
          advertisers.
        </p>
      </LegalSection>

      <LegalSection id="session-persistent" title="4. Session Cookies vs Persistent Cookies">
        <LegalBulletList
          items={[
            <>
              <span className="font-medium text-foreground">Session cookies</span> are temporary
              and are deleted when you close your browser.
            </>,
            <>
              <span className="font-medium text-foreground">Persistent cookies</span> remain on
              your device for a set period (or until you delete them) and are activated each
              time you visit the Site.
            </>,
          ]}
        />
        <p>
          The lifespan of persistent cookies varies depending on their purpose (from a few days
          to several months or longer).
        </p>
      </LegalSection>

      <LegalSection id="third-party" title="5. Third-Party Cookies">
        <p>
          Some cookies on our Site are set by third-party services that appear on our pages.
          These third parties may include:
        </p>
        <LegalBulletList
          items={[
            'Analytics providers (e.g., Google Analytics)',
            'Advertising and retargeting platforms (e.g., Meta Pixel, Google Ads)',
            'Payment service providers',
            'Social media platforms (if you interact with social sharing buttons or embedded content)',
            'Customer support or live chat tools',
          ]}
        />
        <p>
          These third parties may use cookies to collect information about your online
          activities across different websites. We do not control these third-party cookies. We
          encourage you to review the privacy and cookie policies of these third parties for
          more information.
        </p>
      </LegalSection>

      <LegalSection id="duration" title="6. How Long Do Cookies Stay on Your Device?">
        <p>The retention period depends on the type of cookie:</p>
        <div className="overflow-hidden rounded-2xl border border-border/60">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/40 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              <tr>
                <th className="px-4 py-3 sm:px-5">Cookie type</th>
                <th className="px-4 py-3 sm:px-5">Typical duration</th>
              </tr>
            </thead>
            <tbody>
              {DURATION_ROWS.map((row) => (
                <tr
                  key={row.type}
                  className="border-t border-border/50 text-muted-foreground"
                >
                  <td className="px-4 py-3 font-medium text-foreground sm:px-5">
                    {row.type}
                  </td>
                  <td className="px-4 py-3 sm:px-5">{row.duration}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          Exact durations may vary and are set by us or the relevant third party.
        </p>
      </LegalSection>

      <LegalSection id="managing" title="7. Managing and Controlling Cookies">
        <p>You have several options to manage or disable cookies:</p>

        <LegalSubHeading>7.1 Browser Settings</LegalSubHeading>
        <p>
          Most web browsers allow you to control cookies through their settings. You can
          usually:
        </p>
        <LegalBulletList
          items={[
            'See what cookies are stored and delete them individually',
            'Block third-party cookies',
            'Block all cookies',
            'Delete all cookies when you close the browser',
          ]}
        />
        <p>
          Please note that blocking all cookies may prevent you from accessing certain parts of
          the Site or using key features (especially the shopping cart and checkout).
        </p>

        <LegalSubHeading>7.2 Cookie Consent Tool</LegalSubHeading>
        <p>
          Where available on our Site, you can manage your cookie preferences through our cookie
          consent banner or preference centre. You can change your preferences at any time.
        </p>

        <LegalSubHeading>7.3 Opt-Out Tools for Advertising</LegalSubHeading>
        <p>You can opt out of certain interest-based advertising through:</p>
        <LegalBulletList
          items={[
            'Google Ads Settings',
            'Meta/Facebook Ad Preferences',
            'The Network Advertising Initiative (NAI) opt-out page',
            'The Digital Advertising Alliance (DAA) opt-out page',
            'Your device’s advertising identifier settings (on mobile)',
          ]}
        />

        <LegalSubHeading>7.4 Do Not Track Signals</LegalSubHeading>
        <p>
          Some browsers offer a “Do Not Track” (DNT) signal. Our Site currently does not
          respond to DNT signals in a consistent manner because there is no universal standard
          for how websites should interpret them.
        </p>
      </LegalSection>

      <LegalSection id="disabling" title="8. Impact of Disabling Cookies">
        <p>If you choose to disable or delete cookies:</p>
        <LegalBulletList
          items={[
            'You may still browse the Site, but some features may not function properly',
            'Your shopping cart may not work correctly',
            'You may need to re-enter information more frequently',
            'Personalisation and certain marketing features will be limited',
            'We may be less able to improve the Site based on usage data',
          ]}
        />
      </LegalSection>

      <LegalSection id="personal-data" title="9. Cookies and Personal Data">
        <p>
          Some cookies may collect information that can be considered personal data under
          applicable laws (including Uganda’s Data Protection and Privacy Act, 2019). Any
          personal data collected via cookies is processed in accordance with our{' '}
          <LegalRelatedLink href="/privacy">Privacy Policy</LegalRelatedLink>.
        </p>
      </LegalSection>

      <LegalSection id="updates" title="10. Updates to This Cookie Policy">
        <p>
          We may update this Cookie Policy from time to time to reflect changes in technology,
          legal requirements, or our practices. The updated version will be posted on this page
          with a revised “Last Updated” date.
        </p>
        <p>
          We encourage you to review this Policy periodically. Continued use of the Site after
          changes are posted constitutes acceptance of the updated Policy.
        </p>
      </LegalSection>

      <LegalSection id="contact" title="11. Contact Us">
        <p>
          If you have any questions about our use of cookies or this Cookie Policy, please
          contact us:
        </p>
        <LegalContactCards email={LEGAL_PRIVACY_EMAIL} />
        <div className="rounded-2xl border border-border/60 bg-muted/20 px-4 py-4 text-sm sm:px-5">
          <p>
            Website:{' '}
            <a
              href={LEGAL_SITE_URL}
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              {LEGAL_SITE_LABEL}
            </a>
          </p>
          <p className="mt-1">Postal address: {LEGAL_BUSINESS_ADDRESS}</p>
        </div>
        <p>
          You may also refer to our full{' '}
          <LegalRelatedLink href="/privacy">Privacy Policy</LegalRelatedLink> for more
          information about how we collect, use, and protect your personal data.
        </p>
        <LegalCallout tone="primary">
          Thank you for visiting SheQueen. We are committed to being transparent about the
          technologies we use to improve your shopping experience.
        </LegalCallout>
      </LegalSection>
    </LegalPageShell>
  );
}
