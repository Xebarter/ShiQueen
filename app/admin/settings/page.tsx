'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Edit2, DollarSign, Globe, Truck } from 'lucide-react';

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState('currencies');

  const currencies = [
    { code: 'UGX', symbol: 'USh', name: 'Ugandan Shilling', rate: 1.0, enabled: true },
  ];

  const shippingZones = [
    {
      id: 1,
      name: 'Uganda',
      countries: ['Uganda'],
      baseCost: 'USh 50,000',
      freThreshold: 'USh 500,000',
      estimatedDays: '2-3',
    },
    {
      id: 2,
      name: 'East Africa',
      countries: ['Kenya', 'Tanzania', 'Rwanda', 'Burundi'],
      baseCost: 'USh 75,000',
      freeThreshold: 'USh 750,000',
      estimatedDays: '4-6',
    },
    {
      id: 3,
      name: 'Africa',
      countries: ['South Africa', 'Nigeria', 'Ghana', 'Ethiopia', 'Others'],
      baseCost: 'USh 100,000',
      freeThreshold: 'USh 1,000,000',
      estimatedDays: '7-10',
    },
    {
      id: 4,
      name: 'International',
      countries: ['All other countries'],
      baseCost: 'USh 150,000',
      freeThreshold: 'USh 1,500,000',
      estimatedDays: '10-15',
    },
  ];

  const taxes = [
    { id: 1, region: 'Uganda', rate: '18%', type: 'VAT', status: 'Active' },
    { id: 2, region: 'Kenya', rate: '16%', type: 'VAT', status: 'Active' },
    { id: 3, region: 'Tanzania', rate: '18%', type: 'VAT', status: 'Active' },
    { id: 4, region: 'Rwanda', rate: '18%', type: 'VAT', status: 'Active' },
    { id: 5, region: 'South Africa', rate: '15%', type: 'VAT', status: 'Active' },
  ];

  const paymentMethods = [
    { id: 1, name: 'Stripe', status: 'Connected', supportedCurrencies: 'All' },
    { id: 2, name: 'PayPal', status: 'Connected', supportedCurrencies: 'All' },
    { id: 3, name: 'Apple Pay', status: 'Connected', supportedCurrencies: 'All' },
    { id: 4, name: 'Google Pay', status: 'Connected', supportedCurrencies: 'All' },
  ];

  return (
    <div className="p-6 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your international ecommerce operations</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-border">
        {[
          { id: 'currencies', label: 'Currencies', icon: DollarSign },
          { id: 'shipping', label: 'Shipping', icon: Truck },
          { id: 'taxes', label: 'Taxes & Duties', icon: Globe },
          { id: 'payments', label: 'Payment Methods', icon: DollarSign },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 font-medium text-sm flex items-center gap-2 border-b-2 transition ${
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Currencies Tab */}
      {activeTab === 'currencies' && (
        <div>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Supported Currencies</CardTitle>
                  <CardDescription>Manage currencies for your international store</CardDescription>
                </div>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Currency
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 font-medium">Code</th>
                      <th className="text-left py-3 px-4 font-medium">Name</th>
                      <th className="text-left py-3 px-4 font-medium">Exchange Rate</th>
                      <th className="text-left py-3 px-4 font-medium">Status</th>
                      <th className="text-left py-3 px-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currencies.map((currency) => (
                      <tr key={currency.code} className="border-b border-border hover:bg-secondary transition">
                        <td className="py-3 px-4 font-medium">{currency.symbol} {currency.code}</td>
                        <td className="py-3 px-4">{currency.name}</td>
                        <td className="py-3 px-4">{currency.rate}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-1 rounded text-xs font-medium bg-emerald-100 text-emerald-700">
                            {currency.enabled ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm">
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-red-600">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Shipping Tab */}
      {activeTab === 'shipping' && (
        <div>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Shipping Zones</CardTitle>
                  <CardDescription>Configure shipping rates by region</CardDescription>
                </div>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Zone
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {shippingZones.map((zone) => (
                  <div key={zone.id} className="border border-border rounded-lg p-4 hover:shadow-md transition">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold">{zone.name}</h3>
                        <p className="text-sm text-muted-foreground">{zone.countries.join(', ')}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm">
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-600">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground text-xs">Base Cost</p>
                        <p className="font-semibold">{zone.baseCost}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Free Shipping Over</p>
                        <p className="font-semibold">{zone.freeThreshold}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Delivery Time</p>
                        <p className="font-semibold">{zone.estimatedDays}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Taxes Tab */}
      {activeTab === 'taxes' && (
        <div>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Tax Rates by Region</CardTitle>
                  <CardDescription>Manage tax compliance for international markets</CardDescription>
                </div>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Tax Rate
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 font-medium">Region</th>
                      <th className="text-left py-3 px-4 font-medium">Tax Type</th>
                      <th className="text-left py-3 px-4 font-medium">Rate</th>
                      <th className="text-left py-3 px-4 font-medium">Status</th>
                      <th className="text-left py-3 px-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {taxes.map((tax) => (
                      <tr key={tax.id} className="border-b border-border hover:bg-secondary transition">
                        <td className="py-3 px-4 font-medium">{tax.region}</td>
                        <td className="py-3 px-4">{tax.type}</td>
                        <td className="py-3 px-4 font-semibold">{tax.rate}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-1 rounded text-xs font-medium bg-emerald-100 text-emerald-700">
                            {tax.status}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm">
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-red-600">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Payment Methods Tab */}
      {activeTab === 'payments' && (
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Payment Methods</CardTitle>
              <CardDescription>Manage connected payment processors and gateways</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {paymentMethods.map((method) => (
                  <div key={method.id} className="border border-border rounded-lg p-4 flex items-center justify-between hover:shadow-md transition">
                    <div>
                      <h3 className="font-semibold">{method.name}</h3>
                      <p className="text-sm text-muted-foreground">Currencies: {method.supportedCurrencies}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                        {method.status}
                      </span>
                      <Button variant="outline" size="sm">Settings</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
