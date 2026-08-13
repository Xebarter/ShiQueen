import Link from 'next/link';
import { Shield } from 'lucide-react';
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
  { id: 'who-we-are', label: '1. Who We Are' },
  { id: 'information-we-collect', label: '2. Information We Collect' },
  { id: 'how-we-use', label: '3. How We Use Your Information' },
  { id: 'legal-bases', label: '4. Legal Bases for Processing' },
  { id: 'sharing', label: '5. Sharing and Disclosure' },
  { id: 'cookies', label: '6. Cookies and Tracking' },
  { id: 'security', label: '7. Data Security' },
  { id: 'retention', label: '8. Data Retention' },
  { id: 'rights', label: '9. Your Rights and Choices' },
  { id: 'transfers', label: '10. International Transfers' },
  { id: 'children', label: '11. Children’s Privacy' },
  { id: 'third-parties', label: '12. Third-Party Links' },
  { id: 'changes', label: '13. Changes to This Policy' },
  { id: 'contact', label: '14. Contact Us' },
] as const;

export function PrivacyPolicyPage() {
  return (
    <LegalPageShell
      badge="Legal"
      badgeIcon={Shield}
      title="Privacy Policy"
      summary={
        <p>
          ShiQueen (“we,” “us,” “our,” or “the Company”) operates the website and online store
          at{' '}
          <a
            href={LEGAL_SITE_URL}
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            {LEGAL_SITE_LABEL}
          </a>{' '}
          (the “Site”). This Policy explains how we collect, use, disclose, store, and protect
          your personal information.
        </p>
      }
      relatedLinks={
        <>
          <LegalRelatedLink href="/terms">Terms of Service</LegalRelatedLink>
          <LegalRelatedLink href="/cookies">Cookie Policy</LegalRelatedLink>
          <LegalRelatedLink href="/contact">Contact</LegalRelatedLink>
        </>
      }
      toc={TOC}
    >
      <div className="space-y-4 text-[15px] leading-relaxed text-muted-foreground">
        <p>
          We are committed to protecting the privacy and personal data of our customers and
          visitors. This Privacy Policy applies when you visit our Site, create an account, make
          a purchase, or otherwise interact with us.
        </p>
        <p>
          By accessing or using the Site, creating an account, or making a purchase, you
          acknowledge that you have read and understood this Privacy Policy. If you do not agree
          with any part of this Policy, please do not use our Site or services.
        </p>
      </div>

      <LegalSection id="who-we-are" title="1. Who We Are">
        <p>
          ShiQueen is an online shopping and booking app specializing in ladies’ fashion, apparel,
          accessories, beauty products, wellness items, curated packages, and lifestyle service
          bookings. We are committed to empowering women through quality products and a trusted
          shopping experience. Customers may sign in with Google to create an account, save
          favorites, place orders, and manage bookings.
        </p>
        <p>For privacy-related inquiries, you may contact us at:</p>
        <div className="rounded-2xl border border-border/60 bg-muted/20 px-4 py-4 sm:px-5">
          <p>
            Email:{' '}
            <a
              href={`mailto:${LEGAL_PRIVACY_EMAIL}`}
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              {LEGAL_PRIVACY_EMAIL}
            </a>
          </p>
          <p className="mt-1">Postal address: {LEGAL_BUSINESS_ADDRESS}</p>
        </div>
      </LegalSection>

      <LegalSection id="information-we-collect" title="2. Information We Collect">
        <p>
          We collect personal information that you provide directly to us, information collected
          automatically when you use the Site, and information from third parties.
        </p>

        <LegalSubHeading>A. Information You Provide to Us</LegalSubHeading>
        <LegalBulletList
          items={[
            <>
              <span className="font-medium text-foreground">Account registration details:</span>{' '}
              name, email address, password, phone number, date of birth (optional), and
              shipping/billing addresses.
            </>,
            <>
              <span className="font-medium text-foreground">Order and payment information:</span>{' '}
              products purchased, order history, payment method details (note: full payment card
              details are processed by our secure payment providers and are not stored by us in
              full).
            </>,
            <>
              <span className="font-medium text-foreground">Customer service communications:</span>{' '}
              messages, feedback, reviews, survey responses, and support requests.
            </>,
            <>
              <span className="font-medium text-foreground">Marketing preferences:</span>{' '}
              newsletter subscriptions, preferences for promotional communications.
            </>,
            <>
              <span className="font-medium text-foreground">Other voluntary information:</span>{' '}
              wishlist items, size preferences, style preferences, or information shared via
              contact forms, contests, or social media interactions linked to our accounts.
            </>,
          ]}
        />

        <LegalSubHeading>B. Information Collected Automatically</LegalSubHeading>
        <p>
          When you visit or interact with the Site, we and our service providers may
          automatically collect:
        </p>
        <LegalBulletList
          items={[
            <>
              <span className="font-medium text-foreground">Device and technical information:</span>{' '}
              IP address, browser type and version, operating system, device identifiers, screen
              resolution, language settings.
            </>,
            <>
              <span className="font-medium text-foreground">Usage data:</span> pages viewed,
              products browsed or searched, time spent on pages, clickstream data, referring/exit
              pages, and interaction with features (e.g., add-to-cart actions).
            </>,
            <>
              <span className="font-medium text-foreground">Location information:</span> general
              location derived from IP address (we do not collect precise geolocation unless you
              grant permission).
            </>,
            <>
              <span className="font-medium text-foreground">Cookies and similar technologies:</span>{' '}
              as described in the Cookies section below.
            </>,
          ]}
        />

        <LegalSubHeading>C. Information from Third Parties</LegalSubHeading>
        <p>We may receive information about you from:</p>
        <LegalBulletList
          items={[
            'Payment processors and fraud prevention services.',
            'Shipping and logistics partners.',
            'Marketing and analytics partners.',
            'Social media platforms (if you interact with our pages or log in via social features).',
            'Publicly available sources or data enrichment services (where permitted by law).',
          ]}
        />
        <p>
          We do not intentionally collect sensitive personal data (such as racial or ethnic
          origin, political opinions, religious beliefs, health data, or biometric data) unless
          you voluntarily provide it and we have a lawful basis to process it.
        </p>
      </LegalSection>

      <LegalSection id="how-we-use" title="3. How We Use Your Information">
        <p>We use the information we collect for the following purposes:</p>
        <LegalBulletList
          items={[
            'To process and fulfill orders, including payment processing, shipping, order confirmation, and customer support.',
            'To create and manage your account and provide personalized shopping experiences (e.g., size recommendations, personalized product suggestions, wishlists).',
            'To communicate with you about your orders, account, or inquiries.',
            'To send marketing communications, newsletters, promotions, and updates about new products or offers (where you have consented or where otherwise permitted by law). You may opt out at any time.',
            'To improve our Site, products, and services through analytics, research, and testing.',
            'To detect, prevent, and address fraud, security issues, and other illegal or unauthorized activities.',
            'To comply with legal obligations, enforce our Terms of Service, and protect our rights, property, and safety, as well as those of our customers and others.',
            'For any other purpose disclosed at the time of collection or with your consent.',
          ]}
        />
      </LegalSection>

      <LegalSection
        id="legal-bases"
        title="4. Legal Bases for Processing (EEA, UK, and Similar Jurisdictions)"
      >
        <p>
          Where required by applicable law (including the GDPR), we process your personal data
          on the following legal bases:
        </p>
        <LegalBulletList
          items={[
            'Performance of a contract (e.g., processing and delivering your orders).',
            'Legitimate interests (e.g., improving our services, fraud prevention, marketing to existing customers where permitted).',
            'Consent (e.g., for certain marketing communications or non-essential cookies).',
            'Compliance with legal obligations.',
          ]}
        />
        <p>
          You may withdraw consent at any time where processing is based on consent, without
          affecting the lawfulness of processing before withdrawal.
        </p>
      </LegalSection>

      <LegalSection id="sharing" title="5. Sharing and Disclosure of Information">
        <p>
          We do not sell your personal information. We may share your information in the
          following circumstances:
        </p>
        <LegalBulletList
          items={[
            <>
              <span className="font-medium text-foreground">Service providers:</span> With trusted
              third-party vendors who assist us with payment processing, shipping and
              fulfillment, website hosting, email delivery, analytics, customer support,
              marketing, and fraud prevention. These providers are contractually obligated to
              protect your data and use it only for the purposes we specify.
            </>,
            <>
              <span className="font-medium text-foreground">Business transfers:</span> In
              connection with a merger, acquisition, reorganization, sale of assets, or
              bankruptcy, your information may be transferred as part of the transaction
              (subject to appropriate confidentiality and security measures).
            </>,
            <>
              <span className="font-medium text-foreground">Legal requirements:</span> When
              required by law, regulation, legal process, or governmental request, or to protect
              our rights, safety, or property, or that of others.
            </>,
            <>
              <span className="font-medium text-foreground">With your consent or at your direction:</span>{' '}
              When you choose to share information (e.g., product reviews, social sharing
              features).
            </>,
            <>
              <span className="font-medium text-foreground">Aggregated or de-identified data:</span>{' '}
              We may share aggregated or anonymized information that cannot reasonably identify
              you.
            </>,
          ]}
        />
      </LegalSection>

      <LegalSection id="cookies" title="6. Cookies and Tracking Technologies">
        <p>
          We use cookies, web beacons, pixels, and similar technologies to enhance your
          experience, analyze Site usage, and support marketing efforts.
        </p>
        <p>Types of cookies we use include:</p>
        <LegalBulletList
          items={[
            'Essential cookies (necessary for Site functionality, such as shopping cart and checkout).',
            'Performance and analytics cookies (to understand how visitors use the Site).',
            'Functional cookies (to remember preferences).',
            'Advertising and targeting cookies (to deliver relevant ads and measure campaign effectiveness).',
          ]}
        />
        <p>
          You can manage cookie preferences through your browser settings or our cookie consent
          tool (where available). Note that disabling certain cookies may affect Site
          functionality.
        </p>
        <p>
          We may also use third-party analytics and advertising partners (such as Google
          Analytics, Meta Pixel, or similar) that set their own cookies. These partners have
          their own privacy policies.
        </p>
      </LegalSection>

      <LegalSection id="security" title="7. Data Security">
        <p>
          We implement appropriate technical and organizational measures to protect your
          personal information against unauthorized access, alteration, disclosure, or
          destruction. These measures include encryption of data in transit (HTTPS/TLS), secure
          payment processing, access controls, regular security assessments, and staff training.
        </p>
        <p>
          However, no method of transmission over the Internet or electronic storage is 100%
          secure. While we strive to protect your data, we cannot guarantee absolute security.
          You are responsible for maintaining the confidentiality of your account credentials.
        </p>
      </LegalSection>

      <LegalSection id="retention" title="8. Data Retention">
        <p>
          We retain your personal information only for as long as necessary to fulfill the
          purposes outlined in this Policy, including:
        </p>
        <LegalBulletList
          items={[
            'Order and transaction data: typically for the duration required by tax, accounting, and legal obligations (often several years).',
            'Account information: for as long as your account remains active or as needed to provide services.',
            'Marketing data: until you unsubscribe or withdraw consent, plus a short period thereafter for suppression lists.',
            'Analytics and logs: for limited periods consistent with our legitimate interests.',
          ]}
        />
        <p>When data is no longer needed, we securely delete or anonymize it.</p>
      </LegalSection>

      <LegalSection id="rights" title="9. Your Rights and Choices">
        <p>
          Depending on your location and applicable law, you may have the following rights
          regarding your personal data:
        </p>
        <LegalBulletList
          items={[
            <>
              <span className="font-medium text-foreground">Access:</span> Request a copy of the
              personal data we hold about you.
            </>,
            <>
              <span className="font-medium text-foreground">Rectification:</span> Request
              correction of inaccurate or incomplete data.
            </>,
            <>
              <span className="font-medium text-foreground">Erasure (“right to be forgotten”):</span>{' '}
              Request deletion of your data in certain circumstances.
            </>,
            <>
              <span className="font-medium text-foreground">Restriction of processing:</span>{' '}
              Request that we limit how we use your data.
            </>,
            <>
              <span className="font-medium text-foreground">Data portability:</span> Request
              transfer of your data to you or a third party in a structured format.
            </>,
            <>
              <span className="font-medium text-foreground">Objection:</span> Object to processing
              based on legitimate interests or for direct marketing.
            </>,
            <>
              <span className="font-medium text-foreground">Withdraw consent:</span> Where
              processing is based on consent.
            </>,
            <>
              <span className="font-medium text-foreground">Lodge a complaint:</span> With a
              supervisory authority (e.g., in the EEA/UK).
            </>,
          ]}
        />
        <p>
          To exercise these rights, contact us at{' '}
          <a
            href={`mailto:${LEGAL_PRIVACY_EMAIL}`}
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            {LEGAL_PRIVACY_EMAIL}
          </a>
          . We will respond in accordance with applicable law (typically within 30 days). We may
          need to verify your identity before processing certain requests.
        </p>
        <p>
          <span className="font-medium text-foreground">Marketing opt-out:</span> You can
          unsubscribe from marketing emails by clicking the “unsubscribe” link in any email or
          by contacting us. Transactional emails related to orders cannot be opted out of.
        </p>
      </LegalSection>

      <LegalSection id="transfers" title="10. International Data Transfers">
        <p>
          Your information may be transferred to and processed in countries other than your
          country of residence, including countries that may not provide the same level of data
          protection. Where we transfer data from the EEA, UK, or other regions with data
          transfer restrictions, we use appropriate safeguards such as Standard Contractual
          Clauses approved by the relevant authorities, or rely on adequacy decisions where
          available.
        </p>
      </LegalSection>

      <LegalSection id="children" title="11. Children’s Privacy">
        <p>
          Our Site and services are not directed to children under the age of 16 (or the
          applicable age of consent in your jurisdiction). We do not knowingly collect personal
          information from children. If we become aware that we have collected personal data
          from a child without appropriate parental consent, we will take steps to delete that
          information. If you believe a child has provided us with personal data, please contact
          us.
        </p>
      </LegalSection>

      <LegalSection id="third-parties" title="12. Third-Party Links and Services">
        <p>
          Our Site may contain links to third-party websites, plugins, or services (including
          social media platforms and payment providers). This Privacy Policy does not apply to
          those third parties. We encourage you to review their privacy policies before
          providing any personal information.
        </p>
      </LegalSection>

      <LegalSection id="changes" title="13. Changes to This Privacy Policy">
        <p>
          We may update this Privacy Policy from time to time to reflect changes in our
          practices, technology, legal requirements, or other factors. We will post the updated
          Policy on this page with a revised “Last Updated” date. For material changes, we may
          provide additional notice (e.g., via email or a prominent notice on the Site). Your
          continued use of the Site after the effective date of the updated Policy constitutes
          acceptance of the changes.
        </p>
      </LegalSection>

      <LegalSection id="contact" title="14. Contact Us">
        <p>
          If you have any questions, concerns, or requests regarding this Privacy Policy or our
          data practices, please contact us at:
        </p>
        <LegalContactCards email={LEGAL_PRIVACY_EMAIL} />
        <p>
          We will do our best to respond promptly and address your concerns. You can also reach
          our team via the{' '}
          <Link
            href="/contact"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            contact page
          </Link>
          .
        </p>
        <LegalCallout tone="primary">
          Thank you for trusting ShiQueen. We are committed to protecting your privacy while
          helping you feel confident and empowered in every purchase.
        </LegalCallout>
      </LegalSection>
    </LegalPageShell>
  );
}
