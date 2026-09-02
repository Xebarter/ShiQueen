-- Default public feature flags so the first admin save is an UPDATE (admin-only).
insert into public.settings (key, value)
values (
  'features',
  '{
    "packages": true,
    "services": true,
    "wholesale": true,
    "supplierApplications": true,
    "providerApplications": true
  }'::jsonb
)
on conflict (key) do nothing;
