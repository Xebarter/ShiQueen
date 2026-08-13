import { RefreshCw } from 'lucide-react';
import {
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
  { id: 'overview', label: '1. Overview' },
  { id: 'return-window', label: '2. Return Window' },
  { id: 'eligibility', label: '3. Eligibility' },
  { id: 'non-returnable', label: '4. Non-Returnable Items' },
  { id: 'how-to-request', label: '5. How to Request a Return' },
  { id: 'defective', label: '6. Defective or Incorrect Items' },
  { id: 'refund-process', label: '7. Refund Process' },
  { id: 'exchanges', label: '8. Exchanges' },
  { id: 'cancellations', label: '9. Order Cancellations' },
  { id: 'sale-items', label: '10. Sale & Promotional Items' },
  { id: 'late-refunds', label: '11. Late or Missing Refunds' },
  { id: 'changes', label: '12. Changes to This Policy' },
  { id: 'contact', label: '13. Contact Us' },
] as const;

const DEFECT_REPORT_HOURS = 48;

export function RefundPolicyPage() {
  return (
    <LegalPageShell
      badge="Legal"
      badgeIcon={RefreshCw}
      title="Refund Policy"
      summary={
        <>
          <p>
            At ShiQueen, we want you to feel confident and happy with every purchase. This
            Refund Policy explains when and how you can request a refund, return, or exchange
            for products purchased from our online store.
          </p>
          <p>
            This Policy forms part of our Terms of Service. By placing an order with us, you
            agree to the terms of this Refund Policy.
          </p>
        </>
      }
      relatedLinks={
        <>
          <LegalRelatedLink href="/terms">Terms of Service</LegalRelatedLink>
          <LegalRelatedLink href="/privacy">Privacy Policy</LegalRelatedLink>
          <LegalRelatedLink href="/contact">Contact</LegalRelatedLink>
        </>
      }
      toc={TOC}
    >
      <LegalSection id="overview" title="1. Overview">
        <p>
          We offer refunds and returns under the conditions set out below. Our goal is to treat
          every customer fairly while maintaining the quality and hygiene standards expected of
          ladies’ fashion, apparel, accessories, and beauty products.
        </p>
        <p>
          Refunds are generally issued to the original payment method once we have received and
          inspected the returned item(s).
        </p>
      </LegalSection>

      <LegalSection id="return-window" title="2. Return Window">
        <p>
          You may request a return for eligible items within{' '}
          <span className="font-medium text-foreground">{LEGAL_RETURN_DAYS} days</span> from
          the date of delivery.
        </p>
        <p>
          Requests made after this period will not be accepted, except in cases of defective,
          damaged, or incorrect products (see Section 6).
        </p>
      </LegalSection>

      <LegalSection id="eligibility" title="3. Eligibility for Returns & Refunds">
        <p>
          To be eligible for a return and refund, the item must meet{' '}
          <span className="font-medium text-foreground">all</span> of the following conditions:
        </p>
        <LegalBulletList
          items={[
            'It is returned within the return window stated above.',
            'It is unused, unworn, unwashed, and in its original condition.',
            'All original tags, labels, and packaging are intact and attached.',
            'It is in a resalable condition (no signs of wear, stains, odours, makeup, perfume, or damage).',
            'You provide proof of purchase (order number or receipt).',
          ]}
        />
        <p>
          Items that do not meet these conditions may be rejected and returned to you at your
          cost, or accepted at our sole discretion with a reduced refund.
        </p>
      </LegalSection>

      <LegalSection id="non-returnable" title="4. Non-Refundable / Non-Returnable Items">
        <p>
          The following items cannot be returned or refunded (unless they are defective,
          damaged, or incorrect):
        </p>
        <LegalBulletList
          items={[
            'Intimate apparel, underwear, bras, shapewear, and lingerie',
            'Swimwear and bikini sets',
            'Opened or used beauty, skincare, or cosmetic products',
            'Earrings and certain jewellery (for hygiene reasons)',
            'Personalised, customised, or made-to-order items',
            'Gift cards and e-vouchers',
            'Final sale, clearance, or “non-returnable” marked items',
            'Products that have been altered, washed, or damaged by the customer',
            'Free gifts or promotional items (unless the main product is also being returned)',
          ]}
        />
      </LegalSection>

      <LegalSection id="how-to-request" title="5. How to Request a Return or Refund">
        <p>To start a return, please follow these steps:</p>
        <ol className="space-y-3 pl-1">
          {[
            <>
              Contact our Customer Support team within the return window at{' '}
              <a
                href={`mailto:${LEGAL_SUPPORT_EMAIL}`}
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                {LEGAL_SUPPORT_EMAIL}
              </a>{' '}
              or through the{' '}
              <LegalRelatedLink href="/contact">contact form</LegalRelatedLink> on our website.
            </>,
            'Provide your order number, the item(s) you wish to return, and the reason for the return.',
            'Our team will review your request and, if approved, provide you with return instructions and a Return Authorisation.',
            'Securely package the item(s) in the original packaging (where possible) and ship them back to the address we provide.',
            'Once we receive and inspect the returned item(s), we will notify you of the approval or rejection of your refund.',
          ].map((step, index) => (
            <li key={index} className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                {index + 1}
              </span>
              <span className="min-w-0 pt-0.5">{step}</span>
            </li>
          ))}
        </ol>
        <LegalCallout tone="warning">
          Please do not send returns without first obtaining authorisation, as unauthorised
          returns may not be processed.
        </LegalCallout>
      </LegalSection>

      <LegalSection id="defective" title="6. Defective, Damaged, or Incorrect Products">
        <p>If you receive a product that is:</p>
        <LegalBulletList
          items={[
            'Defective or faulty,',
            'Damaged during shipping, or',
            'Significantly different from what you ordered (wrong item, size, or colour),',
          ]}
        />
        <p>
          please contact us within{' '}
          <span className="font-medium text-foreground">{DEFECT_REPORT_HOURS} hours</span> of
          delivery and provide clear photos of the issue together with your order number.
        </p>
        <p>In such cases, we will, at our discretion:</p>
        <LegalBulletList
          items={[
            'Offer a full refund (including original shipping costs where applicable),',
            'Send a replacement, or',
            'Offer store credit.',
          ]}
        />
        <p>
          We will also cover the cost of returning the defective/damaged/incorrect item where
          required.
        </p>
      </LegalSection>

      <LegalSection id="refund-process" title="7. Refund Process and Timeline">
        <LegalBulletList
          items={[
            'Once your return is received and inspected, we will send you an email confirming whether the refund has been approved.',
            <>
              Approved refunds will be processed to the{' '}
              <span className="font-medium text-foreground">original payment method</span> used
              for the purchase.
            </>,
            'Original shipping fees are non-refundable, unless the return is due to our error or a defective product.',
            'Return shipping costs are the responsibility of the customer, except in cases of defective, damaged, or incorrect items.',
          ]}
        />
        <LegalSubHeading>Refund processing times</LegalSubHeading>
        <div className="overflow-hidden rounded-2xl border border-border/60">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/40 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              <tr>
                <th className="px-4 py-3 sm:px-5">Payment method</th>
                <th className="px-4 py-3 sm:px-5">Typical timeline after approval</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-border/50 text-muted-foreground">
                <td className="px-4 py-3 font-medium text-foreground sm:px-5">
                  Mobile money / bank transfer
                </td>
                <td className="px-4 py-3 sm:px-5">Usually 3–10 business days</td>
              </tr>
              <tr className="border-t border-border/50 text-muted-foreground">
                <td className="px-4 py-3 font-medium text-foreground sm:px-5">Card payments</td>
                <td className="px-4 py-3 sm:px-5">
                  5–15 business days depending on your bank
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          Please note that it may take additional time for the refunded amount to appear in
          your account, depending on your payment provider.
        </p>
      </LegalSection>

      <LegalSection id="exchanges" title="8. Exchanges">
        <p>We currently process most size or colour exchanges as a return + new order.</p>
        <p>If you would like a different size or colour:</p>
        <ol className="space-y-3 pl-1">
          {[
            'Return the original item following the process above.',
            'Place a new order for the desired item (subject to availability).',
          ].map((step, index) => (
            <li key={index} className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                {index + 1}
              </span>
              <span className="min-w-0 pt-0.5">{step}</span>
            </li>
          ))}
        </ol>
        <p>
          In some cases, we may offer a direct exchange at our discretion. Contact Customer
          Support to discuss available options.
        </p>
      </LegalSection>

      <LegalSection id="cancellations" title="9. Order Cancellations">
        <LegalBulletList
          items={[
            <>
              You may cancel an order{' '}
              <span className="font-medium text-foreground">before it has been shipped</span> by
              contacting us as soon as possible.
            </>,
            'Once an order has been shipped, it can no longer be cancelled and must go through the return process if you no longer want the items.',
            'If payment has already been processed for a successfully cancelled order, we will issue a full refund.',
          ]}
        />
      </LegalSection>

      <LegalSection id="sale-items" title="10. Sale, Promotional, and Discounted Items">
        <p>
          Items purchased on sale, with discount codes, or during promotional periods are
          eligible for return only if they meet the standard eligibility criteria.
        </p>
        <p>
          Some sale or clearance items may be marked as “Final Sale” and are non-returnable.
          Please check the product page carefully before purchasing.
        </p>
      </LegalSection>

      <LegalSection id="late-refunds" title="11. Late or Missing Refunds">
        <p>If you have not received your refund within the expected timeframe:</p>
        <ol className="space-y-3 pl-1">
          {[
            'Check your bank account or mobile money statement again.',
            'Contact your payment provider, as processing times can vary.',
            'If you still have not received it, contact our Customer Support team with your order number and refund approval details so we can investigate.',
          ].map((step, index) => (
            <li key={index} className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                {index + 1}
              </span>
              <span className="min-w-0 pt-0.5">{step}</span>
            </li>
          ))}
        </ol>
      </LegalSection>

      <LegalSection id="changes" title="12. Changes to This Refund Policy">
        <p>
          We reserve the right to update or modify this Refund Policy at any time. Any changes
          will be posted on this page with an updated “Last Updated” date.
        </p>
        <p>
          Changes will not affect returns already authorised under the previous version of the
          Policy.
        </p>
      </LegalSection>

      <LegalSection id="contact" title="13. Contact Us">
        <p>For any questions about returns, refunds, or this Policy, please contact us:</p>
        <LegalContactCards email={LEGAL_SUPPORT_EMAIL} />
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
        </div>
        <p>Our team is available to assist you and will respond as quickly as possible.</p>
        <LegalCallout tone="primary">
          Thank you for shopping with ShiQueen. We are committed to making your experience
          positive, empowering, and fair. If something is not right with your order, please
          reach out — we’re here to help.
        </LegalCallout>
      </LegalSection>
    </LegalPageShell>
  );
}
