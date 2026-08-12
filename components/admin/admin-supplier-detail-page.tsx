'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Building2,
  Check,
  Edit,
  ExternalLink,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  Package,
  Phone,
  Scissors,
  ShoppingBag,
} from 'lucide-react';
import { AdminPage } from '@/components/admin/admin-page';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { isRemoteProductImage, ProductImage } from '@/components/product-image';
import { useProducts } from '@/lib/products-context';
import { useWholesale } from '@/lib/wholesale-context';
import { useServices } from '@/lib/services-context';
import {
  getSupplier,
  setSupplierApprovalStatus,
} from '@/lib/firebase/suppliers';
import { buildTelLink, buildWhatsAppLink } from '@/lib/phone-utils';
import { formatUGX } from '@/lib/wholesale-data';
import { resolveListingImage } from '@/lib/services-utils';
import { getPackageImage } from '@/lib/package-utils';
import {
  DEFAULT_SUPPLIER_ID,
  SUPPLIER_CATEGORY_OPTIONS,
  type Supplier,
  type SupplierApprovalStatus,
} from '@/lib/types/suppliers';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import Image from 'next/image';

type CatalogTab = 'products' | 'packages' | 'services';

const STATUS_META: Record<
  SupplierApprovalStatus,
  { label: string; className: string }
> = {
  pending: {
    label: 'Pending approval',
    className: 'bg-amber-500/15 text-amber-800 ring-amber-500/25',
  },
  approved: {
    label: 'Approved',
    className: 'bg-emerald-500/15 text-emerald-800 ring-emerald-500/25',
  },
  rejected: {
    label: 'Rejected',
    className: 'bg-rose-500/15 text-rose-800 ring-rose-500/25',
  },
  suspended: {
    label: 'Suspended',
    className: 'bg-slate-500/15 text-slate-800 ring-slate-500/25',
  },
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('en-UG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function ApprovalBadge({ status }: { status: SupplierApprovalStatus }) {
  const meta = STATUS_META[status];
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ring-inset',
        meta.className
      )}
    >
      {meta.label}
    </span>
  );
}

export function AdminSupplierDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const supplierId = params.id;

  const { products, loading: productsLoading } = useProducts();
  const { packages, loading: packagesLoading } = useWholesale();
  const { listings, providers, loading: servicesLoading } = useServices();

  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<CatalogTab>('products');
  const [catalogSearch, setCatalogSearch] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const next = await getSupplier(supplierId);
        if (cancelled) return;
        if (!next) {
          router.replace('/admin/suppliers');
          return;
        }
        setSupplier(next);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [supplierId, router]);

  const supplierProducts = useMemo(
    () => products.filter((p) => (p.supplierId || DEFAULT_SUPPLIER_ID) === supplierId),
    [products, supplierId]
  );

  const supplierPackages = useMemo(
    () => packages.filter((p) => (p.supplierId || DEFAULT_SUPPLIER_ID) === supplierId),
    [packages, supplierId]
  );

  const supplierServices = useMemo(
    () => listings.filter((l) => (l.supplierId || DEFAULT_SUPPLIER_ID) === supplierId),
    [listings, supplierId]
  );

  const q = catalogSearch.trim().toLowerCase();

  const filteredProducts = useMemo(() => {
    if (!q) return supplierProducts;
    return supplierProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.sku?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q)
    );
  }, [supplierProducts, q]);

  const filteredPackages = useMemo(() => {
    if (!q) return supplierPackages;
    return supplierPackages.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q)
    );
  }, [supplierPackages, q]);

  const filteredServices = useMemo(() => {
    if (!q) return supplierServices;
    return supplierServices.filter((s) => {
      const provider = providers.find((pr) => pr.id === s.providerId);
      return (
        s.name.toLowerCase().includes(q) ||
        s.serviceType?.toLowerCase().includes(q) ||
        provider?.businessName?.toLowerCase().includes(q) ||
        provider?.name?.toLowerCase().includes(q)
      );
    });
  }, [supplierServices, providers, q]);

  const catalogLoading = productsLoading || packagesLoading || servicesLoading;

  const handleApproval = async (status: SupplierApprovalStatus) => {
    if (!supplier) return;
    setBusy(true);
    try {
      await setSupplierApprovalStatus(supplier.id, status);
      const patch: Partial<Supplier> = {
        approvalStatus: status,
        updatedAt: new Date(),
      };
      if (status === 'approved') {
        patch.isActive = true;
        patch.approvedAt = new Date();
        patch.rejectionReason = '';
      } else if (status === 'rejected') {
        patch.isActive = false;
        patch.rejectedAt = new Date();
      } else if (status === 'suspended') {
        patch.isActive = false;
      }
      setSupplier({ ...supplier, ...patch });
      toast.success(
        status === 'approved'
          ? 'Supplier approved'
          : status === 'rejected'
            ? 'Supplier rejected'
            : 'Supplier suspended'
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update status');
    } finally {
      setBusy(false);
    }
  };

  const handleToggleActive = async () => {
    if (!supplier) return;
    setBusy(true);
    try {
      const { updateSupplier } = await import('@/lib/firebase/suppliers');
      const nextActive = !supplier.isActive;
      await updateSupplier(supplier.id, { isActive: nextActive });
      setSupplier({ ...supplier, isActive: nextActive, updatedAt: new Date() });
      toast.success(nextActive ? 'Supplier unpaused' : 'Supplier paused');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update supplier');
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!supplier) return null;

  const categoryLabels = SUPPLIER_CATEGORY_OPTIONS.filter((c) =>
    supplier.categories.includes(c.id)
  ).map((c) => c.label);

  const tabs: { id: CatalogTab; label: string; count: number; icon: typeof ShoppingBag }[] = [
    { id: 'products', label: 'Products', count: supplierProducts.length, icon: ShoppingBag },
    { id: 'packages', label: 'Packages', count: supplierPackages.length, icon: Package },
    { id: 'services', label: 'Services', count: supplierServices.length, icon: Scissors },
  ];

  return (
    <AdminPage>
      <div className="mb-6">
        <Link
          href="/admin/suppliers"
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to suppliers
        </Link>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-2xl font-bold tracking-tight sm:text-3xl">
                {supplier.name}
              </h1>
              <ApprovalBadge status={supplier.approvalStatus} />
              {supplier.isDefault && (
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                  Default
                </span>
              )}
              {supplier.approvalStatus === 'approved' && !supplier.isActive && (
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                  Paused
                </span>
              )}
              {supplier.ownerUid && (
                <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  Self-serve
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-muted-foreground sm:text-base">
              {[supplier.companyName, supplier.contactName].filter(Boolean).join(' · ') ||
                'Supplier profile'}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {supplier.approvalStatus === 'pending' && (
              <>
                <Button size="sm" disabled={busy} onClick={() => handleApproval('approved')} className="gap-1">
                  <Check className="h-3.5 w-3.5" />
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  onClick={() => handleApproval('rejected')}
                >
                  Reject
                </Button>
              </>
            )}
            {supplier.approvalStatus === 'approved' &&
              supplier.id !== DEFAULT_SUPPLIER_ID && (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  onClick={() => handleApproval('suspended')}
                >
                  Suspend
                </Button>
              )}
            {(supplier.approvalStatus === 'rejected' ||
              supplier.approvalStatus === 'suspended') && (
              <Button
                size="sm"
                disabled={busy}
                onClick={() => handleApproval('approved')}
                className="gap-1"
              >
                <Check className="h-3.5 w-3.5" />
                Approve
              </Button>
            )}
            {supplier.approvalStatus === 'approved' && (
              <Button size="sm" variant="outline" disabled={busy} onClick={handleToggleActive}>
                {supplier.isActive ? 'Pause' : 'Unpause'}
              </Button>
            )}
            <Link
              href={`/admin/suppliers/${supplier.id}/edit`}
              className={cn(buttonVariants({ size: 'sm' }), 'gap-1')}
            >
              <Edit className="h-3.5 w-3.5" />
              Edit
            </Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          {
            label: 'Products',
            value: supplierProducts.length,
            icon: ShoppingBag,
          },
          {
            label: 'Packages',
            value: supplierPackages.length,
            icon: Package,
          },
          {
            label: 'Services',
            value: supplierServices.length,
            icon: Scissors,
          },
          {
            label: 'Catalog total',
            value:
              supplierProducts.length + supplierPackages.length + supplierServices.length,
            icon: Building2,
          },
        ].map((stat) => (
          <Card key={stat.label} className="border-border/70 shadow-sm">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <stat.icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {stat.label}
                </p>
                <p className="text-xl font-bold tabular-nums">
                  {catalogLoading ? '—' : stat.value}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile */}
        <Card className="border-border/70 shadow-sm lg:col-span-1">
          <CardHeader className="border-b border-border/60 bg-muted/10 pb-4">
            <CardTitle className="text-base">Supplier details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 p-5 text-sm">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Company
              </p>
              <p className="mt-1 font-medium">{supplier.companyName || '—'}</p>
              <p className="text-muted-foreground">{supplier.contactName || '—'}</p>
            </div>

            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Contact
              </p>
              {supplier.email ? (
                <a
                  href={`mailto:${supplier.email}`}
                  className="flex items-center gap-2 text-foreground hover:text-primary"
                >
                  <Mail className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate">{supplier.email}</span>
                </a>
              ) : (
                <p className="text-muted-foreground">No email</p>
              )}
              {supplier.phone ? (
                <a
                  href={buildTelLink(supplier.phone)}
                  className="flex items-center gap-2 hover:text-primary"
                >
                  <Phone className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  {supplier.phone}
                </a>
              ) : null}
              {(supplier.whatsapp || supplier.phone) && (
                <a
                  href={buildWhatsAppLink(supplier.whatsapp || supplier.phone)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-emerald-700 hover:text-emerald-800"
                >
                  <MessageCircle className="h-3.5 w-3.5 shrink-0" />
                  WhatsApp
                </a>
              )}
            </div>

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Location
              </p>
              <p className="mt-1 flex items-start gap-2">
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span>
                  {[supplier.address, supplier.city].filter(Boolean).join(', ') || '—'}
                </span>
              </p>
            </div>

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Categories
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {categoryLabels.length > 0 ? (
                  categoryLabels.map((label) => (
                    <span
                      key={label}
                      className="rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary"
                    >
                      {label}
                    </span>
                  ))
                ) : (
                  <span className="text-muted-foreground">None set</span>
                )}
              </div>
            </div>

            {supplier.notes && (
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Notes
                </p>
                <p className="mt-1 whitespace-pre-wrap text-muted-foreground">{supplier.notes}</p>
              </div>
            )}

            {supplier.rejectionReason && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800">
                <p className="font-semibold">Rejection reason</p>
                <p className="mt-0.5">{supplier.rejectionReason}</p>
              </div>
            )}

            <div className="border-t border-border/60 pt-4 text-xs text-muted-foreground">
              <p>Applied {formatDate(supplier.createdAt)}</p>
              <p className="mt-0.5">Updated {formatDate(supplier.updatedAt)}</p>
              {supplier.approvedAt && (
                <p className="mt-0.5">Approved {formatDate(supplier.approvedAt)}</p>
              )}
              <p className="mt-2 font-mono text-[10px] text-muted-foreground/80">{supplier.id}</p>
            </div>
          </CardContent>
        </Card>

        {/* Catalog */}
        <Card className="overflow-hidden border-border/70 shadow-sm lg:col-span-2">
          <CardHeader className="border-b border-border/60 bg-muted/10 space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="text-base">Catalog</CardTitle>
              <input
                type="search"
                placeholder="Search catalog…"
                value={catalogSearch}
                onChange={(e) => setCatalogSearch(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary sm:max-w-xs"
              />
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {tabs.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id)}
                  className={cn(
                    'flex items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-xs font-semibold transition sm:text-sm',
                    tab === item.id
                      ? 'border-primary/30 bg-primary/10 text-primary'
                      : 'border-border bg-background text-muted-foreground hover:bg-muted/50'
                  )}
                >
                  <item.icon className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{item.label}</span>
                  <span className="tabular-nums opacity-70">({item.count})</span>
                </button>
              ))}
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {catalogLoading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="h-7 w-7 animate-spin text-primary" />
              </div>
            ) : tab === 'products' ? (
              filteredProducts.length === 0 ? (
                <EmptyCatalog label="products" />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/40 text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Product</th>
                        <th className="px-4 py-3 font-semibold">Category</th>
                        <th className="px-4 py-3 font-semibold">Price</th>
                        <th className="px-4 py-3 font-semibold">Stock</th>
                        <th className="px-4 py-3 font-semibold">Status</th>
                        <th className="px-4 py-3 font-semibold" />
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.map((product) => (
                        <tr key={product.id} className="border-t border-border/60 hover:bg-muted/20">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <ProductImage
                                product={product}
                                className="h-12 w-12 shrink-0 rounded-md bg-muted ring-1 ring-border/50"
                                imageClassName="object-cover"
                                fallbackClassName="text-lg opacity-40"
                                sizes="48px"
                              />
                              <div className="min-w-0">
                                <p className="font-medium">{product.name}</p>
                                <p className="font-mono text-[10px] text-muted-foreground">
                                  {product.sku || product.id}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">{product.category}</td>
                          <td className="px-4 py-3 font-medium tabular-nums">
                            {formatUGX(product.price)}
                          </td>
                          <td className="px-4 py-3 tabular-nums">{product.stock}</td>
                          <td className="px-4 py-3">
                            <span className="text-xs font-medium">{product.status}</span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Link
                              href={`/admin/products/${product.id}/edit`}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                            >
                              Edit
                              <ExternalLink className="h-3 w-3" />
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            ) : tab === 'packages' ? (
              filteredPackages.length === 0 ? (
                <EmptyCatalog label="packages" />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/40 text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Package</th>
                        <th className="px-4 py-3 font-semibold">Items</th>
                        <th className="px-4 py-3 font-semibold">Price</th>
                        <th className="px-4 py-3 font-semibold">Status</th>
                        <th className="px-4 py-3 font-semibold" />
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPackages.map((pkg) => {
                        const cover = getPackageImage(pkg, products);
                        return (
                        <tr key={pkg.id} className="border-t border-border/60 hover:bg-muted/20">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-muted ring-1 ring-border/50">
                                {isRemoteProductImage(cover) ? (
                                  <Image
                                    src={cover!}
                                    alt={pkg.name}
                                    fill
                                    className="object-cover"
                                    sizes="48px"
                                  />
                                ) : (
                                  <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/15 to-accent/15">
                                    <Package className="h-4 w-4 text-primary/60" />
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium">{pkg.name}</p>
                                {pkg.tagline && (
                                  <p className="line-clamp-1 text-xs text-muted-foreground">
                                    {pkg.tagline}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 tabular-nums text-muted-foreground">
                            {pkg.items?.length ?? 0}
                          </td>
                          <td className="px-4 py-3 font-medium tabular-nums">
                            {formatUGX(pkg.discountedPrice || pkg.basePrice)}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={cn(
                                'rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase',
                                pkg.isActive
                                  ? 'bg-emerald-500/15 text-emerald-800'
                                  : 'bg-slate-500/15 text-slate-700'
                              )}
                            >
                              {pkg.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Link
                              href={`/admin/packages/${pkg.id}`}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                            >
                              Edit
                              <ExternalLink className="h-3 w-3" />
                            </Link>
                          </td>
                        </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )
            ) : filteredServices.length === 0 ? (
              <EmptyCatalog label="services" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Service</th>
                      <th className="px-4 py-3 font-semibold">Provider</th>
                      <th className="px-4 py-3 font-semibold">Price</th>
                      <th className="px-4 py-3 font-semibold">Duration</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 font-semibold" />
                    </tr>
                  </thead>
                  <tbody>
                    {filteredServices.map((service) => {
                      const provider = providers.find((p) => p.id === service.providerId);
                      const cover = resolveListingImage(service);
                      return (
                        <tr
                          key={service.id}
                          className="border-t border-border/60 hover:bg-muted/20"
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-muted ring-1 ring-border/50">
                                {cover ? (
                                  <Image
                                    src={cover}
                                    alt={service.name}
                                    fill
                                    className="object-cover"
                                    sizes="48px"
                                  />
                                ) : (
                                  <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/15 to-accent/15">
                                    <Scissors className="h-4 w-4 text-primary/60" />
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium">{service.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {service.serviceType}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {provider?.businessName || provider?.name || '—'}
                          </td>
                          <td className="px-4 py-3 font-medium tabular-nums">
                            {formatUGX(service.basePrice)}
                          </td>
                          <td className="px-4 py-3 tabular-nums text-muted-foreground">
                            {service.durationMinutes} min
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={cn(
                                'rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase',
                                service.isActive && !service.isArchived
                                  ? 'bg-emerald-500/15 text-emerald-800'
                                  : 'bg-slate-500/15 text-slate-700'
                              )}
                            >
                              {service.isArchived
                                ? 'Archived'
                                : service.isActive
                                  ? 'Active'
                                  : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Link
                              href="/admin/services"
                              className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                            >
                              Manage
                              <ExternalLink className="h-3 w-3" />
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminPage>
  );
}

function EmptyCatalog({ label }: { label: string }) {
  return (
    <div className="px-6 py-14 text-center">
      <Building2 className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40" />
      <p className="font-semibold">No {label} linked</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Assign this supplier on {label} in the admin catalog.
      </p>
    </div>
  );
}
