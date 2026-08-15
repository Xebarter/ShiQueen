'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Archive,
  Inbox,
  Loader2,
  Mail,
  MailOpen,
  Search,
  Trash2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AdminPage, AdminPageHeader } from '@/components/admin/admin-page';
import {
  deleteContactMessage,
  subscribeContactMessages,
  updateContactMessageStatus,
} from '@/lib/firebase/contact-messages';
import {
  contactTopicLabel,
  type ContactMessage,
  type ContactMessageStatus,
} from '@/lib/types/contact-messages';
import { cn } from '@/lib/utils';

type StatusFilter = 'all' | ContactMessageStatus;

function formatWhen(date: Date) {
  return date.toLocaleString('en-UG', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export function AdminMessagesPage() {
  const searchParams = useSearchParams();
  const deepLinkId = searchParams.get('id');

  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeContactMessages(
      (next) => {
        setMessages(next);
        setLoading(false);
      },
      (error) => {
        console.error('Contact messages subscription error:', error);
        toast.error('Failed to load messages');
        setLoading(false);
      }
    );
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (deepLinkId) setSelectedId(deepLinkId);
  }, [deepLinkId]);

  const filtered = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return messages.filter((message) => {
      if (statusFilter !== 'all' && message.status !== statusFilter) return false;
      if (!query) return true;
      return (
        message.name.toLowerCase().includes(query) ||
        message.email.toLowerCase().includes(query) ||
        message.subject.toLowerCase().includes(query) ||
        message.message.toLowerCase().includes(query) ||
        contactTopicLabel(message.topic).toLowerCase().includes(query)
      );
    });
  }, [messages, searchTerm, statusFilter]);

  const selected =
    filtered.find((message) => message.id === selectedId) ??
    messages.find((message) => message.id === selectedId) ??
    filtered[0] ??
    null;

  useEffect(() => {
    if (!selected) return;
    if (selectedId !== selected.id) setSelectedId(selected.id);
  }, [selected, selectedId]);

  const unreadCount = messages.filter((message) => message.status === 'unread').length;

  const markStatus = async (message: ContactMessage, status: ContactMessageStatus) => {
    if (message.status === status) return;
    setBusyId(message.id);
    try {
      await updateContactMessageStatus(message.id, status);
      toast.success(status === 'read' ? 'Marked as read' : status === 'unread' ? 'Marked unread' : 'Archived');
    } catch {
      toast.error('Could not update message');
    } finally {
      setBusyId(null);
    }
  };

  const handleSelect = (message: ContactMessage) => {
    setSelectedId(message.id);
    if (message.status === 'unread') {
      void markStatus(message, 'read');
    }
  };

  const handleDelete = async (message: ContactMessage) => {
    if (!confirm(`Delete message from ${message.name}?`)) return;
    setBusyId(message.id);
    try {
      await deleteContactMessage(message.id);
      if (selectedId === message.id) setSelectedId(null);
      toast.success('Message deleted');
    } catch {
      toast.error('Could not delete message');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <AdminPage>
      <AdminPageHeader
        title="Messages"
        description="Contact form submissions from the website"
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {(
          [
            { id: 'all', label: 'All' },
            { id: 'unread', label: `Unread${unreadCount ? ` (${unreadCount})` : ''}` },
            { id: 'read', label: 'Read' },
            { id: 'archived', label: 'Archived' },
          ] as const
        ).map((filter) => (
          <button
            key={filter.id}
            type="button"
            onClick={() => setStatusFilter(filter.id)}
            className={cn(
              'rounded-full px-3 py-1.5 text-xs font-medium transition sm:text-sm',
              statusFilter === filter.id
                ? 'bg-primary text-primary-foreground'
                : 'border border-border bg-background text-muted-foreground hover:text-foreground'
            )}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
        <Card className="overflow-hidden border-border/70 shadow-sm">
          <CardHeader className="border-b border-border/60 bg-muted/10 space-y-3">
            <div>
              <CardTitle className="text-lg">Inbox</CardTitle>
              <CardDescription>
                {loading
                  ? 'Loading…'
                  : `${filtered.length} message${filtered.length === 1 ? '' : 's'}`}
              </CardDescription>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search name, email, subject…"
                className="w-full rounded-lg border border-border bg-background py-2.5 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-7 w-7 animate-spin text-primary" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="px-4 py-12 text-center text-sm text-muted-foreground">
                <Inbox className="mx-auto mb-3 h-8 w-8 opacity-50" />
                No messages found
              </div>
            ) : (
              <ul className="max-h-[70vh] divide-y divide-border overflow-y-auto">
                {filtered.map((message) => {
                  const active = selected?.id === message.id;
                  return (
                    <li key={message.id}>
                      <button
                        type="button"
                        onClick={() => handleSelect(message)}
                        className={cn(
                          'w-full px-4 py-3.5 text-left transition hover:bg-secondary/50',
                          active && 'bg-secondary/70',
                          message.status === 'unread' && 'bg-primary/[0.04]'
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p
                            className={cn(
                              'truncate text-sm',
                              message.status === 'unread' ? 'font-semibold' : 'font-medium'
                            )}
                          >
                            {message.name}
                          </p>
                          {message.status === 'unread' ? (
                            <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                          ) : null}
                        </div>
                        <p className="mt-0.5 truncate text-sm text-foreground/90">{message.subject}</p>
                        <p className="mt-1 truncate text-xs text-muted-foreground">
                          {contactTopicLabel(message.topic)} · {formatWhen(message.createdAt)}
                        </p>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-sm">
          {!selected ? (
            <CardContent className="flex min-h-[24rem] flex-col items-center justify-center py-16 text-center text-muted-foreground">
              <Mail className="mb-3 h-8 w-8 opacity-50" />
              <p>Select a message to read it</p>
            </CardContent>
          ) : (
            <>
              <CardHeader className="border-b border-border/60 space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <CardTitle className="text-xl leading-snug">{selected.subject}</CardTitle>
                    <CardDescription className="mt-2 space-y-1">
                      <span className="block">
                        From{' '}
                        <a
                          href={`mailto:${selected.email}`}
                          className="font-medium text-primary hover:underline"
                        >
                          {selected.name} &lt;{selected.email}&gt;
                        </a>
                      </span>
                      <span className="block">
                        {contactTopicLabel(selected.topic)} · {formatWhen(selected.createdAt)}
                      </span>
                    </CardDescription>
                  </div>
                  <span
                    className={cn(
                      'inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-medium capitalize',
                      selected.status === 'unread' && 'bg-primary/10 text-primary',
                      selected.status === 'read' && 'bg-muted text-muted-foreground',
                      selected.status === 'archived' && 'bg-amber-100 text-amber-800'
                    )}
                  >
                    {selected.status}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={busyId === selected.id}
                    onClick={() =>
                      void markStatus(
                        selected,
                        selected.status === 'unread' ? 'read' : 'unread'
                      )
                    }
                    className="gap-1.5"
                  >
                    {selected.status === 'unread' ? (
                      <MailOpen className="h-4 w-4" />
                    ) : (
                      <Mail className="h-4 w-4" />
                    )}
                    {selected.status === 'unread' ? 'Mark read' : 'Mark unread'}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={busyId === selected.id || selected.status === 'archived'}
                    onClick={() => void markStatus(selected, 'archived')}
                    className="gap-1.5"
                  >
                    <Archive className="h-4 w-4" />
                    Archive
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={busyId === selected.id}
                    onClick={() => void handleDelete(selected)}
                    className="gap-1.5 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                  <a
                    href={`mailto:${selected.email}?subject=${encodeURIComponent(`Re: ${selected.subject}`)}`}
                    className="inline-flex"
                  >
                    <Button type="button" size="sm" className="gap-1.5">
                      <Mail className="h-4 w-4" />
                      Reply by email
                    </Button>
                  </a>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-foreground/90">
                  {selected.message}
                </p>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </AdminPage>
  );
}
