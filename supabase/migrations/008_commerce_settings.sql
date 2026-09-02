-- Default commerce settings so the first admin save is an UPDATE (admin-only).
-- Shipping Uganda baseCost is 0 and tax is off so live checkout stays free until an admin changes it.
insert into public.settings (key, value)
values (
  'commerce',
  '{
    "currencies": [
      { "code": "UGX", "symbol": "USh", "name": "Ugandan Shilling", "enabled": true }
    ],
    "shipping": {
      "zones": [
        {
          "id": "zone-uganda",
          "name": "Uganda",
          "countries": ["Uganda"],
          "baseCost": 0,
          "freeThreshold": 500000,
          "estimatedDays": "2–3 days",
          "enabled": true
        },
        {
          "id": "zone-east-africa",
          "name": "East Africa",
          "countries": ["Kenya", "Tanzania", "Rwanda", "Burundi"],
          "baseCost": 75000,
          "freeThreshold": 750000,
          "estimatedDays": "4–6 days",
          "enabled": true
        },
        {
          "id": "zone-africa",
          "name": "Africa",
          "countries": ["South Africa", "Nigeria", "Ghana", "Ethiopia", "Others"],
          "baseCost": 100000,
          "freeThreshold": 1000000,
          "estimatedDays": "7–10 days",
          "enabled": true
        },
        {
          "id": "zone-international",
          "name": "International",
          "countries": ["All other countries"],
          "baseCost": 150000,
          "freeThreshold": 1500000,
          "estimatedDays": "10–15 days",
          "enabled": true
        }
      ]
    },
    "taxes": {
      "regions": [
        { "id": "tax-uganda", "region": "Uganda", "country": "Uganda", "type": "VAT", "rate": 0.18, "enabled": false },
        { "id": "tax-kenya", "region": "Kenya", "country": "Kenya", "type": "VAT", "rate": 0.16, "enabled": false },
        { "id": "tax-tanzania", "region": "Tanzania", "country": "Tanzania", "type": "VAT", "rate": 0.18, "enabled": false },
        { "id": "tax-rwanda", "region": "Rwanda", "country": "Rwanda", "type": "VAT", "rate": 0.18, "enabled": false },
        { "id": "tax-south-africa", "region": "South Africa", "country": "South Africa", "type": "VAT", "rate": 0.15, "enabled": false }
      ]
    },
    "payments": {
      "mobile_money": { "enabled": true },
      "card": { "enabled": true },
      "cash_on_delivery": { "enabled": true }
    }
  }'::jsonb
)
on conflict (key) do nothing;
