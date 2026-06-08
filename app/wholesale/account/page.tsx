'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useWholesale } from '@/lib/wholesale-context';
import { useAuth } from '@/lib/auth-context';
import toast from 'react-hot-toast';
import { Building2, CheckCircle, ArrowLeft } from 'lucide-react';

export default function WholesaleAccountPage() {
  const { applyForAccount } = useWholesale();
  const { user } = useAuth();
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    companyName: '',
    taxId: '',
    contactName: '',
    phone: '',
    businessType: '',
    estimatedVolume: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.companyName || !formData.contactName || !formData.phone) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await applyForAccount({
        customerId: user?.uid || user?.email || `guest-${Date.now()}`,
        companyName: formData.companyName,
        taxId: formData.taxId || undefined,
      });

      setSubmitted(true);
      toast.success('Application submitted successfully!');
    } catch {
      toast.error('Failed to submit application');
    }
  };

  if (submitted) {
    return (
      <main>
        <Header />
        <section className="py-20 bg-background">
          <div className="max-w-lg mx-auto px-4 text-center">
            <CheckCircle className="w-16 h-16 text-emerald-600 mx-auto mb-6" />
            <h1 className="text-3xl font-light mb-4">Application Received</h1>
            <p className="text-muted-foreground mb-8">
              Thank you for applying for a wholesale account. Our team will review your application
              within 2-3 business days and contact you at the email on file.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/wholesale">
                <Button>Start Bulk Order</Button>
              </Link>
            </div>
          </div>
        </section>
        <Footer />
      </main>
    );
  }

  return (
    <main>
      <Header />

      <section className="py-12 bg-background">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            href="/wholesale"
            className="flex items-center gap-2 text-primary hover:underline mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Wholesale
          </Link>

          <div className="flex items-center gap-4 mb-8">
            <Building2 className="w-10 h-10 text-primary" />
            <div>
              <h1 className="text-4xl font-light tracking-tight">Apply for Wholesale Account</h1>
              <p className="text-muted-foreground">
                Get access to exclusive pricing, credit terms, and dedicated support
              </p>
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name *</Label>
                <Input
                  id="companyName"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  placeholder="Your Business Ltd."
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="taxId">Tax ID / TIN</Label>
                <Input
                  id="taxId"
                  name="taxId"
                  value={formData.taxId}
                  onChange={handleChange}
                  placeholder="Optional"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contactName">Contact Name *</Label>
                  <Input
                    id="contactName"
                    name="contactName"
                    value={formData.contactName}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessType">Business Type</Label>
                <select
                  id="businessType"
                  name="businessType"
                  value={formData.businessType}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                >
                  <option value="">Select type</option>
                  <option value="retailer">Retailer</option>
                  <option value="distributor">Distributor</option>
                  <option value="salon">Salon / Spa</option>
                  <option value="hotel">Hotel / Hospitality</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="estimatedVolume">Estimated Monthly Volume</Label>
                <select
                  id="estimatedVolume"
                  name="estimatedVolume"
                  value={formData.estimatedVolume}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                >
                  <option value="">Select range</option>
                  <option value="10-49">10-49 units</option>
                  <option value="50-99">50-99 units</option>
                  <option value="100+">100+ units</option>
                  <option value="500+">500+ units</option>
                </select>
              </div>

              <div className="p-4 bg-secondary/50 rounded-lg text-sm text-muted-foreground">
                <p className="font-semibold text-foreground mb-2">Wholesale Account Benefits</p>
                <ul className="space-y-1">
                  <li>• Volume discounts up to 25%</li>
                  <li>• Account-level pricing and credit limits</li>
                  <li>• Dedicated account manager</li>
                  <li>• Priority order processing</li>
                </ul>
              </div>

              <Button type="submit" size="lg" className="w-full">
                Submit Application
              </Button>
            </form>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
