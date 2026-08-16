import { ContactPage } from '@/components/contact/contact-page';
import { NoscriptPageSummary } from '@/components/seo/noscript-page-summary';
import { CONTACT_FAQS } from '@/lib/seo/home-faqs';
import { faqJsonLd, JsonLd } from '@/lib/seo/json-ld';
import { PAGE_SEO } from '@/lib/seo/site';

export const metadata = PAGE_SEO.contact;

export default function Contact() {
  return (
    <>
      <JsonLd data={faqJsonLd([...CONTACT_FAQS])} />
      <ContactPage />
      <NoscriptPageSummary
        title="Contact ShiQueen Kampala"
        description="Contact ShiQueen in Kampala, Uganda for orders, beauty bookings, wholesale, and support. WhatsApp, phone, and email — nationwide delivery."
      />
    </>
  );
}
