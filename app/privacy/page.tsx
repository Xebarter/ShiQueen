import { Header } from '@/components/header';
import { Footer } from '@/components/footer';

export default function Privacy() {
  return (
    <main>
      <Header />

      <section className="py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-light tracking-tight mb-12">Privacy Policy</h1>

          <div className="prose prose-invert max-w-none space-y-6 text-muted-foreground">
            <div>
              <h2 className="text-2xl font-semibold text-foreground mb-3">
                1. Introduction
              </h2>
              <p>
                SheQueen (&quot;we&quot; or &quot;us&quot; or &quot;our&quot;) operates the shequeen.com website
                (the &quot;Service&quot;). This page informs you of our policies regarding the collection, use, and
                disclosure of personal data when you use our Service and the choices you have associated with that
                data.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-foreground mb-3">
                2. Information Collection And Use
              </h2>
              <p>
                We collect several different types of information for various purposes to provide and improve our
                Service to you.
              </p>
              <h3 className="text-lg font-semibold text-foreground mt-4 mb-2">Types of Data Collected:</h3>
              <ul className="list-disc list-inside space-y-2">
                <li>Personal Data: Email address, name, phone number, postal address</li>
                <li>Usage Data: Browser type, IP address, pages visited, time and date of visits</li>
                <li>
                  Cookies and Tracking Data: We use cookies to track activity on our Service
                </li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-foreground mb-3">
                3. Use of Data
              </h2>
              <p>SheQueen uses the collected data for various purposes:</p>
              <ul className="list-disc list-inside space-y-2">
                <li>To provide and maintain the Service</li>
                <li>To notify you about changes to our Service</li>
                <li>To allow you to participate in interactive features of our Service</li>
                <li>To provide customer care and support</li>
                <li>To gather analysis or valuable information so that we can improve the Service</li>
                <li>To monitor the usage of the Service</li>
                <li>To detect, prevent and address technical issues</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-foreground mb-3">
                4. Security Of Data
              </h2>
              <p>
                The security of your data is important to us, but remember that no method of transmission over the
                Internet or method of electronic storage is 100% secure. While we strive to use commercially acceptable
                means to protect your Personal Data, we cannot guarantee its absolute security.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-foreground mb-3">
                5. Contact Us
              </h2>
              <p>If you have any questions about this Privacy Policy, please contact us at:</p>
              <p className="mt-2">
                Email: privacy@shequeen.com
                <br />
                Address: New York, NY 10001, USA
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
