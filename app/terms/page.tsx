import { Header } from '@/components/header';
import { Footer } from '@/components/footer';

export default function Terms() {
  return (
    <main>
      <Header />

      <section className="py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-light tracking-tight mb-12">Terms of Service</h1>

          <div className="prose prose-invert max-w-none space-y-6 text-muted-foreground">
            <div>
              <h2 className="text-2xl font-semibold text-foreground mb-3">
                1. Agreement to Terms
              </h2>
              <p>
                By accessing and using this website, you accept and agree to be bound by the terms and provision of
                this agreement. If you do not agree to abide by the above, please do not use this service.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-foreground mb-3">
                2. Use License
              </h2>
              <p>
                Permission is granted to temporarily download one copy of the materials (information or software) on
                SheQueen website for personal, non-commercial transitory viewing only. This is the grant of a
                license, not a transfer of title, and under this license you may not:
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li>Modifying or copying the materials</li>
                <li>Using the materials for any commercial purpose or for any public display</li>
                <li>
                  Attempting to decompile or reverse engineer any software contained on SheQueen website
                </li>
                <li>Removing any copyright or other proprietary notations from the materials</li>
                <li>Transferring the materials to another person or &quot;mirroring&quot; the materials on any other server</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-foreground mb-3">
                3. Disclaimer
              </h2>
              <p>
                The materials on SheQueen website are provided on an &apos;as is&apos; basis. SheQueen makes no
                warranties, expressed or implied, and hereby disclaims and negates all other warranties including,
                without limitation, implied warranties or conditions of merchantability, fitness for a particular
                purpose, or non-infringement of intellectual property or other violation of rights.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-foreground mb-3">
                4. Limitations
              </h2>
              <p>
                In no event shall SheQueen or its suppliers be liable for any damages (including, without
                limitation, damages for loss of data or profit, or due to business interruption) arising out of the
                use or inability to use the materials on the SheQueen website.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-foreground mb-3">
                5. Accuracy of Materials
              </h2>
              <p>
                The materials appearing on SheQueen website could include technical, typographical, or
                photographic errors. SheQueen does not warrant that any of the materials on its website are
                accurate, complete, or current. SheQueen may make changes to the materials contained on its website
                at any time without notice.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-foreground mb-3">
                6. Links
              </h2>
              <p>
                SheQueen has not reviewed all of the sites linked to its website and is not responsible for the
                contents of any such linked site. The inclusion of any link does not imply endorsement by SheQueen
                of the site. Use of any such linked website is at the user&apos;s own risk.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-foreground mb-3">
                7. Modifications
              </h2>
              <p>
                SheQueen may revise these terms of service for its website at any time without notice. By using
                this website, you are agreeing to be bound by the then current version of these terms of service.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-foreground mb-3">
                8. Governing Law
              </h2>
              <p>
                These terms and conditions are governed by and construed in accordance with the laws of New York, and
                you irrevocably submit to the exclusive jurisdiction of the courts located in that location.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
