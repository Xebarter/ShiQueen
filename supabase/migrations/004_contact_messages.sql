-- Contact form inbox for admin Messages

create table if not exists public.contact_messages (
  id text primary key,
  name text not null default '',
  email text not null default '',
  topic text not null default 'general',
  subject text not null default '',
  message text not null default '',
  status text not null default 'unread'
    check (status in ('unread', 'read', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_contact_messages_created_at
  on public.contact_messages (created_at desc);

create index if not exists idx_contact_messages_status
  on public.contact_messages (status);

alter table public.contact_messages enable row level security;

-- Public never reads the inbox. Inserts go through the service-role API.
create policy contact_messages_select on public.contact_messages
  for select using (public.is_admin());

create policy contact_messages_update on public.contact_messages
  for update using (public.is_admin());

create policy contact_messages_delete on public.contact_messages
  for delete using (public.is_admin());

do $$
begin
  alter publication supabase_realtime add table public.contact_messages;
exception
  when duplicate_object then null;
end $$;
