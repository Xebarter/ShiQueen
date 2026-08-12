import { Scale } from 'lucide-react';
import {
  LEGAL_BUSINESS_ADDRESS,
  LEGAL_DEFECT_REPORT_DAYS,
  LEGAL_RETURN_DAYS,
  LEGAL_SITE_LABEL,
  LEGAL_SITE_URL,
  LEGAL_SUPPORT_EMAIL,
  LegalBulletList,
  LegalCallout,
  LegalContactCards,
  LegalPageShell,
  LegalRelatedLink,
  LegalSection,
  LegalSubHeading,
} from '@/components/legal/legal-page-shell';

const TOC = [
  { id: 'about', label: '1. About SheQueen' },
  { id: 'eligibility', label: '2. Eligibility' },
  { id: 'accounts', label: '3. Account Registration' },
  { id: 'products', label: '4. Products & Pricing' },
  { id: 'orders', label: '5. Orders & Acceptance' },
  { id: 'payment', label: '6. Payment Terms' },
  { id: 'shipping', label: '7. Shipping & Delivery' },
  { id: 'returns', label: '8. Returns & Refunds' },
  { id: 'ip', label: '9. Intellectual Property' },
  { id: 'user-content', label: '10. User Content' },
  { id: 'prohibited', label: '11. Prohibited Conduct' },
  { id: 'third-parties', label: '12. Third-Party Services' },
  { id: 'disclaimers', label: '13. Disclaimers' },
  { id: 'liability', label: '14. Limitation of Liability' },
  { id: 'indemnification', label: '15. Indemnification' },
  { id: 'force-majeure', label: '16. Force Majeure' },
  { id: 'governing-law', label: '17. Governing Law' },
  { id: 'termination', label: '18. Termination' },
  { id: 'changes', label: '19. Changes to These Terms' },
  { id: 'miscellaneous', label: '20. Miscellaneous' },
  { id: 'contact', label: '21. Contact Information' },
] as const;

export function TermsOfServicePage() {
  return (
    <LegalPageShell
      badge="Legal"
      badgeIcon={Scale}
      title="Terms of Service"
      summary={
        <>
          <p>
            These Terms of Service (“Terms,” “Agreement”) constitute a legally binding
            agreement between you (“you,” “your,” “Customer,” or “User”) and SheQueen
            (“SheQueen,” “we,” “us,” or “our”), a company operating in Uganda.
          </p>
          <p>
            By accessing, browsing, or using{' '}
            <a
              href={LEGAL_SITE_URL}
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              {LEGAL_SITE_LABEL}
            </a>{' '}
            (the “Site”), creating an account, placing an order, or otherwise engaging with
            our services, you agree to be bound by these Terms and our Privacy Policy.
          </p>
        </>
      }
      relatedLinks={
        <>
          <LegalRelatedLink href="/privacy">Privacy Policy</LegalRelatedLink>
          <LegalRelatedLink href="/refunds">Refund Policy</LegalRelatedLink>
          <LegalRelatedLink href="/cookies">Cookie Policy</LegalRelatedLink>
          <LegalRelatedLink href="/contact">Contact</LegalRelatedLink>
        </>
      }
      toc={TOC}
    >
      <LegalCallout tone="warning">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-800 dark:text-amber-200">
          Important notice
        </p>
        <p className="mt-2">
          If you do not agree to these Terms, you must not use the Site or purchase any
          products. These Terms are governed by the laws of the Republic of Uganda.
        </p>
      </LegalCallout>

      <LegalSection id="about" title="1. About SheQueen">
        <p>
          SheQueen is an online ecommerce platform specializing in ladies’ fashion, apparel,
          accessories, beauty products, and related lifestyle items. We operate from Uganda
          and sell primarily to customers within Uganda and, where available,
          internationally.
        </p>
        <p>Our business details:</p>
        <div className="rounded-2xl border border-border/60 bg-muted/20 px-4 py-4 sm:px-5">
          <dl className="grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Legal / trading name
              </dt>
              <dd className="mt-1 text-sm font-medium text-foreground">SheQueen</dd>
            </div>
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Registered address
              </dt>
              <dd className="mt-1 text-sm font-medium text-foreground">
                {LEGAL_BUSINESS_ADDRESS}
              </dd>
            </div>
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Contact email
              </dt>
              <dd className="mt-1 text-sm font-medium text-foreground">
                <a
                  href={`mailto:${LEGAL_SUPPORT_EMAIL}`}
                  className="text-primary underline-offset-4 hover:underline"
                >
                  {LEGAL_SUPPORT_EMAIL}
                </a>
              </dd>
            </div>
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Website
              </dt>
              <dd className="mt-1 text-sm font-medium text-foreground">
                <a
                  href={LEGAL_SITE_URL}
                  className="text-primary underline-offset-4 hover:underline"
                >
                  {LEGAL_SITE_LABEL}
                </a>
              </dd>
            </div>
          </dl>
        </div>
      </LegalSection>

      <LegalSection id="eligibility" title="2. Eligibility and Age Requirements">
        <p>
          You must be at least 18 years of age (or the age of legal majority in your
          jurisdiction) to create an account, place orders, or enter into binding contracts
          with us.
        </p>
        <p>By using the Site, you represent and warrant that:</p>
        <LegalBulletList
          items={[
            'You are at least 18 years old.',
            'You have the legal capacity to enter into a binding contract under Ugandan law.',
            'All information you provide is accurate, current, and complete.',
            'You will not use the Site for any unlawful purpose.',
          ]}
        />
        <p>
          We reserve the right to refuse service, cancel accounts, or cancel orders if we
          reasonably believe these eligibility requirements are not met.
        </p>
      </LegalSection>

      <LegalSection id="accounts" title="3. Account Registration and Security">
        <p>
          To access certain features (including order history, wishlists, and faster
          checkout), you may be required to create an account.
        </p>
        <p>You agree to:</p>
        <LegalBulletList
          items={[
            'Provide accurate, complete, and up-to-date registration information.',
            'Maintain the confidentiality of your login credentials.',
            'Accept full responsibility for all activities that occur under your account.',
            'Notify us immediately of any unauthorized use of your account or security breach.',
          ]}
        />
        <p>
          We reserve the right to suspend or terminate accounts that we believe have been
          compromised, used fraudulently, or violated these Terms. You may not transfer or
          share your account with others.
        </p>
      </LegalSection>

      <LegalSection id="products" title="4. Products, Descriptions, and Pricing">
        <LegalSubHeading>4.1 Product Information</LegalSubHeading>
        <p>
          We make reasonable efforts to display accurate product descriptions, images,
          colours, sizes, materials, and availability. However:
        </p>
        <LegalBulletList
          items={[
            'Colours may appear differently depending on your device screen and lighting.',
            'Measurements and sizing are approximate.',
            'We do not warrant that product descriptions or other content on the Site are error-free, complete, or current.',
          ]}
        />
        <p>
          In the event of a material error (e.g., incorrect price or description), we reserve
          the right to cancel the order and issue a full refund.
        </p>

        <LegalSubHeading>4.2 Pricing</LegalSubHeading>
        <p>
          All prices are displayed in Ugandan Shillings (UGX) unless otherwise stated. Prices
          include applicable taxes where required by Ugandan law, unless indicated otherwise.
        </p>
        <p>
          We reserve the right to change prices at any time without prior notice. Price
          changes will not affect orders already confirmed.
        </p>
        <p>
          Promotional prices, discounts, and coupon codes are subject to specific terms and
          may be modified or withdrawn at our discretion.
        </p>

        <LegalSubHeading>4.3 Availability</LegalSubHeading>
        <p>
          Product availability is not guaranteed. We may limit quantities, discontinue
          products, or refuse orders at our sole discretion.
        </p>
      </LegalSection>

      <LegalSection id="orders" title="5. Orders, Acceptance, and Contract Formation">
        <p>Placing an order constitutes an offer to purchase.</p>
        <p>
          A binding contract is formed only when we send you an order confirmation email (or
          equivalent notification) accepting your order.
        </p>
        <p>
          We reserve the right to refuse or cancel any order for reasons including, but not
          limited to:
        </p>
        <LegalBulletList
          items={[
            'Product unavailability',
            'Pricing or description errors',
            'Suspected fraud or unauthorized payment',
            'Violation of these Terms',
            'Shipping restrictions',
          ]}
        />
        <p>
          If we cancel an order after payment has been taken, we will issue a full refund.
        </p>
      </LegalSection>

      <LegalSection id="payment" title="6. Payment Terms">
        <p>
          We accept payment methods displayed at checkout (e.g., mobile money, debit/credit
          cards, bank transfer, or other methods available in Uganda).
        </p>
        <LegalBulletList
          items={[
            'You represent that you are authorized to use the selected payment method.',
            'Payment is processed securely through third-party payment providers. We do not store full payment card details.',
            'All payments are processed in Ugandan Shillings (UGX) unless otherwise agreed. Currency conversion fees (if any) charged by your bank or payment provider are your responsibility.',
            'In the event of a failed or reversed payment, we may cancel the order and pursue recovery of any amounts owed.',
          ]}
        />
      </LegalSection>

      <LegalSection id="shipping" title="7. Shipping, Delivery, and Risk of Loss">
        <LegalSubHeading>7.1 Shipping</LegalSubHeading>
        <p>
          We ship within Uganda and, where offered, internationally. Shipping costs, methods,
          and estimated delivery times are displayed at checkout and may vary based on
          location, product weight, and selected service.
        </p>
        <p>
          Delivery times are estimates only and are not guaranteed. Delays may occur due to
          customs, weather, courier issues, or force majeure events.
        </p>

        <LegalSubHeading>7.2 Risk of Loss and Title</LegalSubHeading>
        <p>
          Title to and risk of loss of products pass to you upon delivery to the shipping
          address you provided (or collection from a designated pickup point).
        </p>
        <p>
          You are responsible for providing accurate shipping information. We are not liable
          for delays or non-delivery caused by incorrect addresses.
        </p>

        <LegalSubHeading>7.3 Customs and Import Duties (International Orders)</LegalSubHeading>
        <p>
          For international shipments, you are solely responsible for all customs duties,
          taxes, import fees, and clearance procedures. We are not responsible for delays or
          seizures by customs authorities.
        </p>
      </LegalSection>

      <LegalSection id="returns" title="8. Returns, Refunds, Exchanges, and Cancellations">
        <LegalSubHeading>8.1 Right to Cancel / Change of Mind</LegalSubHeading>
        <p>
          Subject to the conditions below, you may return eligible products within{' '}
          <span className="font-medium text-foreground">{LEGAL_RETURN_DAYS} days</span> of
          delivery for a refund or exchange, provided the items are:
        </p>
        <LegalBulletList
          items={[
            'Unused, unworn, unwashed, and in original condition',
            'In original packaging with all tags attached',
            'Accompanied by proof of purchase',
          ]}
        />
        <p>
          For full details, see our{' '}
          <LegalRelatedLink href="/refunds">Refund Policy</LegalRelatedLink>.
        </p>

        <LegalSubHeading>8.2 Non-Returnable Items</LegalSubHeading>
        <p>The following items are generally non-returnable (unless defective):</p>
        <LegalBulletList
          items={[
            'Intimate apparel, swimwear, and certain hygiene-related products',
            'Personalized or custom-made items',
            'Sale/clearance items marked as final sale',
            'Beauty products that have been opened or used',
            'Gift cards',
          ]}
        />

        <LegalSubHeading>8.3 Defective or Incorrect Products</LegalSubHeading>
        <p>
          If you receive a defective, damaged, or incorrect product, contact us within{' '}
          <span className="font-medium text-foreground">
            {LEGAL_DEFECT_REPORT_DAYS} days
          </span>{' '}
          of delivery with photos and order details. We will arrange a replacement, repair, or
          refund at our discretion.
        </p>

        <LegalSubHeading>8.4 Refund Process</LegalSubHeading>
        <p>
          Approved refunds will be processed to the original payment method within a
          reasonable time after we receive and inspect the returned item. Shipping costs are
          non-refundable unless the return is due to our error.
        </p>

        <LegalSubHeading>8.5 Return Shipping</LegalSubHeading>
        <p>
          Unless the return is due to our error or a defective product, you are responsible
          for return shipping costs and risk of loss during return transit.
        </p>
        <p>
          We reserve the right to refuse returns that do not meet the above conditions.
        </p>
      </LegalSection>

      <LegalSection id="ip" title="9. Intellectual Property Rights">
        <p>
          All content on the Site — including text, graphics, logos, images, product
          photographs, videos, software, designs, and trademarks — is the property of
          SheQueen or its licensors and is protected by Ugandan and international intellectual
          property laws.
        </p>
        <p>
          You may not copy, reproduce, modify, distribute, display, or create derivative works
          from any Site content without our prior written consent.
        </p>
        <p>
          You may use the Site solely for personal, non-commercial purposes related to
          shopping with us.
        </p>
      </LegalSection>

      <LegalSection id="user-content" title="10. User Content and Reviews">
        <p>
          You may submit reviews, comments, photos, or other content (“User Content”). By
          submitting User Content, you grant SheQueen a worldwide, non-exclusive, royalty-free,
          perpetual, irrevocable license to use, reproduce, modify, adapt, publish, translate,
          distribute, and display such content in any media.
        </p>
        <p>You represent that your User Content:</p>
        <LegalBulletList
          items={[
            'Is accurate and not misleading',
            'Does not infringe any third-party rights',
            'Does not contain unlawful, defamatory, obscene, or offensive material',
            'Does not contain viruses or malicious code',
          ]}
        />
        <p>
          We reserve the right to remove or edit User Content at our sole discretion without
          notice.
        </p>
      </LegalSection>

      <LegalSection id="prohibited" title="11. Prohibited Conduct">
        <p>You agree not to:</p>
        <LegalBulletList
          items={[
            'Use the Site for any unlawful purpose or in violation of Ugandan law',
            'Attempt to gain unauthorized access to the Site, accounts, or systems',
            'Interfere with or disrupt the Site or servers',
            'Use automated means (bots, scrapers) to access the Site without permission',
            'Impersonate any person or entity',
            'Engage in fraudulent activities, including false claims or chargebacks',
            'Upload or transmit viruses, malware, or harmful code',
            'Harass, abuse, or harm other users or our staff',
            'Violate any applicable export control or sanctions laws',
          ]}
        />
        <p>
          Violation may result in immediate termination of your account, cancellation of
          orders, and legal action.
        </p>
      </LegalSection>

      <LegalSection id="third-parties" title="12. Third-Party Services and Links">
        <p>
          The Site may contain links to third-party websites, payment gateways, shipping
          providers, or social media platforms. We do not control and are not responsible for
          the content, privacy practices, or terms of those third parties. Your use of
          third-party services is at your own risk and subject to their terms.
        </p>
      </LegalSection>

      <LegalSection id="disclaimers" title="13. Disclaimers">
        <LegalCallout tone="muted">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-foreground">
            To the maximum extent permitted by Ugandan law
          </p>
          <ul className="mt-3 space-y-2.5">
            <li>
              The Site and all products are provided “as is” and “as available” without
              warranties of any kind, whether express or implied, including but not limited to
              warranties of merchantability, fitness for a particular purpose, title, or
              non-infringement.
            </li>
            <li>
              We do not warrant that the Site will be uninterrupted, error-free, secure, or
              free of viruses.
            </li>
            <li>
              We do not warrant the accuracy, completeness, or reliability of any product
              descriptions, pricing, or content.
            </li>
            <li>Product colours, sizes, and appearance may vary.</li>
          </ul>
        </LegalCallout>
        <p>
          Nothing in these Terms excludes or limits any rights you may have under mandatory
          consumer protection laws of Uganda that cannot be excluded by contract.
        </p>
      </LegalSection>

      <LegalSection id="liability" title="14. Limitation of Liability">
        <LegalCallout tone="muted">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-foreground">
            To the maximum extent permitted by applicable law
          </p>
          <ul className="mt-3 space-y-2.5">
            <li>
              SheQueen and its directors, employees, agents, and affiliates shall not be liable
              for any indirect, incidental, special, consequential, punitive, or exemplary
              damages, including loss of profits, data, goodwill, or business opportunities,
              arising out of or related to your use of the Site or products.
            </li>
            <li>
              Our total aggregate liability arising out of or related to these Terms or any
              order shall not exceed the total amount you paid to us for the specific order
              giving rise to the claim.
            </li>
          </ul>
        </LegalCallout>
        <p>
          Some jurisdictions do not allow certain limitations of liability. In such cases, our
          liability will be limited to the fullest extent permitted by law.
        </p>
      </LegalSection>

      <LegalSection id="indemnification" title="15. Indemnification">
        <p>
          You agree to indemnify, defend, and hold harmless SheQueen and its officers,
          directors, employees, agents, and affiliates from and against any claims,
          liabilities, damages, losses, costs, and expenses (including reasonable legal fees)
          arising out of or related to:
        </p>
        <LegalBulletList
          items={[
            'Your breach of these Terms',
            'Your violation of any law or third-party rights',
            'Your User Content',
            'Your misuse of the Site or products',
          ]}
        />
      </LegalSection>

      <LegalSection id="force-majeure" title="16. Force Majeure">
        <p>
          We shall not be liable for any failure or delay in performing our obligations due to
          circumstances beyond our reasonable control, including but not limited to acts of
          God, natural disasters, war, terrorism, riots, embargoes, acts of civil or military
          authorities, fire, floods, accidents, strikes, shortages of transportation,
          facilities, fuel, energy, labour, or materials, pandemics, epidemics, government
          actions, or failures of public infrastructure (including internet or payment
          systems).
        </p>
      </LegalSection>

      <LegalSection id="governing-law" title="17. Governing Law and Dispute Resolution">
        <p>
          These Terms shall be governed by and construed in accordance with the laws of the
          Republic of Uganda, without regard to conflict of law principles.
        </p>
        <p>
          Any dispute arising out of or relating to these Terms or your use of the Site shall
          first be attempted to be resolved amicably through good-faith negotiations.
        </p>
        <p>
          If the dispute cannot be resolved amicably within thirty (30) days, it shall be
          submitted to the exclusive jurisdiction of the competent courts of Uganda.
        </p>
        <p>
          Nothing in this section prevents either party from seeking interim or injunctive
          relief in any court of competent jurisdiction.
        </p>
      </LegalSection>

      <LegalSection id="termination" title="18. Termination">
        <p>
          We may suspend or terminate your access to the Site or your account at any time,
          with or without cause or notice, including for violation of these Terms.
        </p>
        <p>
          Upon termination, your right to use the Site ceases immediately. Provisions that by
          their nature should survive termination (including intellectual property,
          disclaimers, limitation of liability, indemnification, and governing law) shall
          survive.
        </p>
      </LegalSection>

      <LegalSection id="changes" title="19. Changes to These Terms">
        <p>
          We reserve the right to modify these Terms at any time. Updated Terms will be posted
          on the Site with a revised “Last Updated” date.
        </p>
        <p>
          Material changes will be effective upon posting or as otherwise notified. Your
          continued use of the Site after changes become effective constitutes acceptance of
          the revised Terms.
        </p>
        <p>We encourage you to review these Terms periodically.</p>
      </LegalSection>

      <LegalSection id="miscellaneous" title="20. Miscellaneous">
        <LegalSubHeading>Entire Agreement</LegalSubHeading>
        <p>
          These Terms, together with the Privacy Policy and any order-specific terms,
          constitute the entire agreement between you and SheQueen and supersede all prior
          agreements.
        </p>

        <LegalSubHeading>Severability</LegalSubHeading>
        <p>
          If any provision of these Terms is found to be invalid or unenforceable, the
          remaining provisions shall continue in full force and effect.
        </p>

        <LegalSubHeading>Waiver</LegalSubHeading>
        <p>
          Our failure to enforce any right or provision shall not constitute a waiver of such
          right or provision.
        </p>

        <LegalSubHeading>Assignment</LegalSubHeading>
        <p>
          You may not assign or transfer these Terms without our prior written consent. We may
          assign these Terms freely.
        </p>

        <LegalSubHeading>Notices</LegalSubHeading>
        <p>
          Notices to you may be provided via email, posting on the Site, or other reasonable
          means. Notices to us must be sent to the contact details provided below.
        </p>

        <LegalSubHeading>Language</LegalSubHeading>
        <p>
          These Terms are drafted in English. Any translation is provided for convenience
          only; the English version shall prevail in case of conflict.
        </p>
      </LegalSection>

      <LegalSection id="contact" title="21. Contact Information">
        <p>
          For questions about these Terms of Service, orders, or any related matters, please
          contact us:
        </p>
        <LegalContactCards email={LEGAL_SUPPORT_EMAIL} />
        <LegalCallout tone="primary">
          <p className="font-medium text-foreground">Acknowledgement</p>
          <p className="mt-1.5">
            By using the Site or placing an order, you confirm that you have read, understood,
            and agreed to these Terms of Service.
          </p>
          <p className="mt-3">
            Thank you for choosing SheQueen. We are committed to providing you with quality
            products and a positive shopping experience.
          </p>
        </LegalCallout>
      </LegalSection>
    </LegalPageShell>
  );
}
