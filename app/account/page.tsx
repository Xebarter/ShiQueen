'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import { subscribeUserOrders } from '@/lib/firebase/orders';
import { Order } from '@/lib/types/database';
import { formatUGX } from '@/lib/wholesale-data';
import { LogOut, Heart, ShoppingBag, Settings, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Account() {
  const { user, logout, loading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/sign-in');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user?.uid) {
      setOrdersLoading(false);
      return;
    }

    const unsubscribe = subscribeUserOrders(
      user.uid,
      (userOrders) => {
        setOrders(userOrders);
        setOrdersLoading(false);
      },
      () => setOrdersLoading(false)
    );
    return unsubscribe;
  }, [user?.uid]);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
      router.push('/');
    } catch (error) {
      toast.error('Failed to log out');
      console.error(error);
    }
  };

  if (loading) {
    return (
      <main>
        <Header />
        <section className="min-h-[calc(100vh-8rem)] flex items-center justify-center">
          <p className="text-muted-foreground">Loading...</p>
        </section>
        <Footer />
      </main>
    );
  }

  if (!user) {
    return null;
  }

  const menuItems = [
    {
      label: 'Orders',
      description: 'View your purchase history',
      icon: ShoppingBag,
      href: '#orders',
    },
    {
      label: 'Wishlist',
      description: 'Saved items for later',
      icon: Heart,
      href: '#wishlist',
    },
    {
      label: 'Settings',
      description: 'Manage your account',
      icon: Settings,
      href: '#settings',
    },
  ];

  return (
    <main>
      <Header />

      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-4xl font-light tracking-tight mb-2">Account</h1>
            <p className="text-muted-foreground">Manage your profile and orders</p>
          </div>

          {/* Welcome Card */}
          <div className="bg-secondary rounded-lg p-8 mb-12">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-semibold mb-2">Welcome back!</h2>
                <p className="text-muted-foreground">
                  Signed in as <span className="font-semibold text-foreground">{user.email}</span>
                </p>
              </div>
              <Button
                variant="outline"
                onClick={handleLogout}
                className="gap-2"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </Button>
            </div>
          </div>

          {/* Menu Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <a
                  key={item.label}
                  href={item.href}
                  className="group block"
                >
                  <div className="border border-border rounded-lg p-6 hover:bg-secondary transition h-full">
                    <Icon className="w-8 h-8 text-primary mb-4 group-hover:text-accent transition" />
                    <h3 className="font-semibold text-lg mb-1">{item.label}</h3>
                    <p className="text-sm text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                </a>
              );
            })}
          </div>

          {/* Orders Section */}
          <div id="orders" className="mb-12 scroll-mt-20">
            <h2 className="text-2xl font-light mb-6">Recent Orders</h2>
            {ordersLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : orders.length === 0 ? (
              <div className="border border-border rounded-lg p-8 text-center">
                <p className="text-muted-foreground">No orders yet</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Start shopping to see your orders here
                </p>
                <Link href="/shop" className="mt-4 inline-block">
                  <Button>Browse Shop</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order.id} className="border border-border rounded-lg p-6">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-semibold">{order.id}</p>
                        <p className="text-sm text-muted-foreground">
                          {order.createdAt.toLocaleDateString()} · {order.items.length} items
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatUGX(order.total)}</p>
                        <p className="text-xs capitalize text-muted-foreground">{order.status}</p>
                      </div>
                    </div>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {order.items.slice(0, 3).map((item, i) => (
                        <li key={i}>
                          {item.name} × {item.quantity}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Wishlist Section */}
          <div id="wishlist" className="mb-12 scroll-mt-20">
            <h2 className="text-2xl font-light mb-6">Wishlist</h2>
            <div className="border border-border rounded-lg p-8 text-center">
              <p className="text-muted-foreground">No items in wishlist</p>
              <p className="text-sm text-muted-foreground mt-2">
                Save items while shopping to add them here
              </p>
              <Link href="/shop" className="mt-4 inline-block">
                <Button>Continue Shopping</Button>
              </Link>
            </div>
          </div>

          {/* Settings Section */}
          <div id="settings" className="scroll-mt-20">
            <h2 className="text-2xl font-light mb-6">Account Settings</h2>
            <div className="space-y-4">
              <div className="border border-border rounded-lg p-6">
                <h3 className="font-semibold mb-2">Email Address</h3>
                <p className="text-muted-foreground text-sm mb-4">{user.email}</p>
                <Button variant="outline" disabled>
                  Update Email (Coming Soon)
                </Button>
              </div>

              <div className="border border-border rounded-lg p-6">
                <h3 className="font-semibold mb-2">Password</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Change your password to keep your account secure
                </p>
                <Button variant="outline" disabled>
                  Change Password (Coming Soon)
                </Button>
              </div>

              <div className="border border-border rounded-lg p-6">
                <h3 className="font-semibold mb-2">Notification Preferences</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Manage your email and notification settings
                </p>
                <Button variant="outline" disabled>
                  Update Preferences (Coming Soon)
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
