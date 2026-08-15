'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Archive,
  ArrowLeft,
  Inbox,
  Loader2,
  Mail,
  MailOpen,
  Reply,
  Search,
  Trash2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, CardContent } from '@/components/ui/card';
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
import { getEmailInitial, getAvatarColorsForLetter } from '@/lib/user-display';
import { cn } from '@/lib/utils';

type StatusFilter = 'all' | ContactMessageStatus;

function formatWhen(date: Date) {
  return date.toLocaleString('en-UG', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function formatListWhen(date: Date) {
  const now = new Date();
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  if (sameDay) {
    return date.toLocaleTimeString('en-UG', {
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getFullYear() === yesterday.getFullYear() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getDate() === yesterday.getDate();

  if (isYesterday) return 'Yesterday';

  return date.toLocaleDateString('en-UG', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() === now.getFullYear() ? undefined : 'numeric',
  });
}

function SenderAvatar({ name, email }: { name: string; email: string }) {
  const initial = getEmailInitial(email) || name.trim().charAt(0).toUpperCase() || '?';
  const colors = getAvatarColorsForLetter(initial);

  return (
    <span
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold"
      style={{ backgroundColor: colors.background, color: colors.foreground }}
      aria-hidden
    >
      {initial}
    </span>
  );
}

function StatusBadge({ status }: { status: ContactMessageStatus }) {
  return (
    <span
      className={cn(
        'inline-flex w-fit rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize',
        status === 'unread' && 'bg-primary/10 text-primary',
        status === 'read' && 'bg-muted text-muted-foreground',
        status === 'archived' && 'bg-amber-100 text-amber-800'
      )}
    >
      {status}
    </span>
  );
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

  const selected = useMemo(() => {
    if (!selectedId) return null;
    return (
      filtered.find((message) => message.id === selectedId) ??
      messages.find((message) => message.id === selectedId) ??
      null
    );
  }, [filtered, messages, selectedId]);

  const unreadCount = messages.filter((message) => message.status === 'unread').length;
  const showDetail = Boolean(selected);

  const markStatus = async (message: ContactMessage, status: ContactMessageStatus) => {
    if (message.status === status) return;
    setBusyId(message.id);
    try {
      await updateContactMessageStatus(message.id, status);
      toast.success(
        status === 'read' ? 'Marked as read' : status === 'unread' ? 'Marked unread' : 'Archived'
      );
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

  const handleBackToList = () => {
    setSelectedId(null);
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
    <AdminPage className="pb-6 sm:pb-8">
      <div className={cn(showDetail && 'hidden lg:block')}>
        <AdminPageHeader
          title="Messages"
          description="Contact form submissions from the website"
        />
      </div>

      <div
        className={cn(
          'mb-3 -mx-1 flex gap-2 overflow-x-auto px-1 pb-1 scrollbar-hide',
          showDetail && 'hidden lg:flex'
        )}
      >
        {(
          [
            { id: 'all', label: 'All' },
            { id: 'unread', label: unreadCount ? `Unread (${unreadCount})` : 'Unread' },
            { id: 'read', label: 'Read' },
            { id: 'archived', label: 'Archived' },
          ] as const
        ).map((filter) => (
          <button
            key={filter.id}
            type="button"
            onClick={() => setStatusFilter(filter.id)}
            className={cn(
              'shrink-0 rounded-full px-3.5 py-2 text-sm font-medium transition',
              'min-h-10 touch-manipulation',
              statusFilter === filter.id
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'border border-border bg-background text-muted-foreground hover:text-foreground'
            )}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:items-start">
        {/* Inbox list — full screen on mobile until a message is opened */}
        <Card
          className={cn(
            'overflow-hidden border-border/70 shadow-sm',
            showDetail && 'hidden lg:block'
          )}
        >
          <div className="space-y-3 border-b border-border/60 bg-muted/10 px-4 py-3 sm:px-5 sm:py-4">
            <div className="flex items-baseline justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold tracking-tight sm:text-lg">Inbox</h2>
                <p className="text-xs text-muted-foreground sm:text-sm">
                  {loading
                    ? 'Loading…'
                    : `${filtered.length} message${filtered.length === 1 ? '' : 's'}`}
                </p>
              </div>
            </div>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search name, email, subject…"
                className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-3 text-base focus:outline-none focus:ring-2 focus:ring-primary sm:py-2.5 sm:text-sm"
              />
            </div>
          </div>

          <div className="p-0">
            {loading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="h-7 w-7 animate-spin text-primary" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="px-4 py-16 text-center text-sm text-muted-foreground">
                <Inbox className="mx-auto mb-3 h-9 w-9 opacity-40" />
                <p className="font-medium text-foreground/80">No messages found</p>
                <p className="mt-1 text-xs">Try another filter or search term.</p>
              </div>
            ) : (
              <ul className="divide-y divide-border lg:max-h-[min(70vh,40rem)] lg:overflow-y-auto">
                {filtered.map((message) => {
                  const active = selected?.id === message.id;
                  const unread = message.status === 'unread';
                  return (
                    <li key={message.id}>
                      <button
                        type="button"
                        onClick={() => handleSelect(message)}
                        className={cn(
                          'flex w-full items-start gap-3 px-4 py-3.5 text-left transition',
                          'min-h-[4.5rem] touch-manipulation active:bg-secondary/70',
                          'hover:bg-secondary/50',
                          active && 'bg-secondary/70 lg:bg-secondary/70',
                          unread && !active && 'bg-primary/[0.03]'
                        )}
                      >
                        <SenderAvatar name={message.name} email={message.email} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p
                              className={cn(
                                'truncate text-[15px] leading-tight',
                                unread ? 'font-semibold text-foreground' : 'font-medium text-foreground/90'
                              )}
                            >
                              {message.name}
                            </p>
                            <span className="shrink-0 pt-0.5 text-[11px] tabular-nums text-muted-foreground">
                              {formatListWhen(message.createdAt)}
                            </span>
                          </div>
                          <p
                            className={cn(
                              'mt-0.5 truncate text-sm',
                              unread ? 'font-medium text-foreground/85' : 'text-foreground/75'
                            )}
                          >
                            {message.subject}
                          </p>
                          <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                            {contactTopicLabel(message.topic)}
                            {message.message ? ` · ${message.message}` : ''}
                          </p>
                        </div>
                        {unread ? (
                          <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />
                        ) : (
                          <span className="mt-2 h-2 w-2 shrink-0" aria-hidden />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </Card>

        {/* Message detail — full screen on mobile when selected */}
        <Card
          className={cn(
            'relative border-border/70 shadow-sm',
            !showDetail && 'hidden lg:flex lg:min-h-[24rem] lg:flex-col',
            showDetail && 'flex min-h-[calc(100dvh-5.5rem)] flex-col lg:min-h-0'
          )}
        >
          {!selected ? (
            <CardContent className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center text-muted-foreground">
              <Mail className="mb-3 h-9 w-9 opacity-40" />
              <p className="font-medium text-foreground/80">Select a message</p>
              <p className="mt-1 max-w-xs text-sm">
                Choose a conversation from the inbox to read and reply.
              </p>
            </CardContent>
          ) : (
            <>
              <div className="sticky top-0 z-10 border-b border-border/60 bg-card/95 backdrop-blur-sm">
                <div className="flex items-center gap-2 px-3 py-2.5 lg:hidden">
                  <button
                    type="button"
                    onClick={handleBackToList}
                    className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-secondary hover:text-foreground"
                    aria-label="Back to inbox"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{selected.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{selected.email}</p>
                  </div>
                  <StatusBadge status={selected.status} />
                </div>

                <div className="space-y-3 px-4 py-4 sm:px-5">
                  <div className="hidden items-start justify-between gap-3 lg:flex">
                    <div className="min-w-0">
                      <h2 className="text-xl font-semibold leading-snug tracking-tight">
                        {selected.subject}
                      </h2>
                      <p className="mt-2 text-sm text-muted-foreground">
                        From{' '}
                        <a
                          href={`mailto:${selected.email}`}
                          className="font-medium text-primary hover:underline"
                        >
                          {selected.name} &lt;{selected.email}&gt;
                        </a>
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {contactTopicLabel(selected.topic)} · {formatWhen(selected.createdAt)}
                      </p>
                    </div>
                    <StatusBadge status={selected.status} />
                  </div>

                  <div className="lg:hidden">
                    <h2 className="text-lg font-semibold leading-snug tracking-tight">
                      {selected.subject}
                    </h2>
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      {contactTopicLabel(selected.topic)} · {formatWhen(selected.createdAt)}
                    </p>
                  </div>

                  {/* Desktop / tablet actions */}
                  <div className="hidden flex-wrap gap-2 sm:flex">
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
                        <Reply className="h-4 w-4" />
                        Reply by email
                      </Button>
                    </a>
                  </div>
                </div>
              </div>

              <CardContent className="flex-1 px-4 py-5 sm:px-5 sm:pt-6 pb-28 sm:pb-6">
                <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-foreground/90 sm:text-base">
                  {selected.message}
                </p>
              </CardContent>

              {/* Mobile sticky action bar */}
              <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border/70 bg-card/95 px-3 py-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] backdrop-blur-sm sm:hidden">
                <div className="mx-auto flex max-w-lg items-center gap-2">
                  <a
                    href={`mailto:${selected.email}?subject=${encodeURIComponent(`Re: ${selected.subject}`)}`}
                    className="min-w-0 flex-1"
                  >
                    <Button type="button" className="h-11 w-full gap-2 text-[15px]">
                      <Reply className="h-4 w-4" />
                      Reply
                    </Button>
                  </a>
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    disabled={busyId === selected.id}
                    onClick={() =>
                      void markStatus(
                        selected,
                        selected.status === 'unread' ? 'read' : 'unread'
                      )
                    }
                    className="h-11 w-11 shrink-0"
                    aria-label={selected.status === 'unread' ? 'Mark read' : 'Mark unread'}
                  >
                    {selected.status === 'unread' ? (
                      <MailOpen className="h-4 w-4" />
                    ) : (
                      <Mail className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    disabled={busyId === selected.id || selected.status === 'archived'}
                    onClick={() => void markStatus(selected, 'archived')}
                    className="h-11 w-11 shrink-0"
                    aria-label="Archive"
                  >
                    <Archive className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    disabled={busyId === selected.id}
                    onClick={() => void handleDelete(selected)}
                    className="h-11 w-11 shrink-0 text-red-600 hover:text-red-700"
                    aria-label="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </Card>
      </div>
    </AdminPage>
  );
}
