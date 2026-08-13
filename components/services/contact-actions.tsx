'use client';

import { Phone, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { buildTelLink, buildWhatsAppLink } from '@/lib/services-utils';
import { cn } from '@/lib/utils';

interface ContactActionsProps {
  phone: string;
  whatsapp?: string;
  serviceName?: string;
  compact?: boolean;
  className?: string;
  onBook?: () => void;
  showBook?: boolean;
}

export function ContactActions({
  phone,
  whatsapp,
  serviceName,
  compact,
  className,
  onBook,
  showBook = true,
}: ContactActionsProps) {
  const wa = whatsapp || phone;
  const waMessage = serviceName
    ? `Hi, I'm interested in ${serviceName} on ShiQueen.`
    : "Hi, I'd like to inquire about your services on ShiQueen.";

  if (compact) {
    return (
      <div className={cn('flex gap-2', className)}>
        <a href={buildTelLink(phone)} className="flex-1">
          <Button type="button" variant="outline" size="sm" className="w-full gap-1.5 rounded-xl">
            <Phone className="h-3.5 w-3.5" />
            Call
          </Button>
        </a>
        <a href={buildWhatsAppLink(wa, waMessage)} target="_blank" rel="noopener noreferrer" className="flex-1">
          <Button type="button" variant="outline" size="sm" className="w-full gap-1.5 rounded-xl border-emerald-500/30 text-emerald-700 hover:bg-emerald-500/10">
            <MessageCircle className="h-3.5 w-3.5" />
            WhatsApp
          </Button>
        </a>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      <a href={buildTelLink(phone)}>
        <Button type="button" variant="outline" className="gap-2 rounded-xl">
          <Phone className="h-4 w-4" />
          Call
        </Button>
      </a>
      <a href={buildWhatsAppLink(wa, waMessage)} target="_blank" rel="noopener noreferrer">
        <Button type="button" variant="outline" className="gap-2 rounded-xl border-emerald-500/30 text-emerald-700 hover:bg-emerald-500/10">
          <MessageCircle className="h-4 w-4" />
          WhatsApp
        </Button>
      </a>
      {showBook && onBook && (
        <Button type="button" className="gap-2 rounded-xl shadow-md shadow-primary/20" onClick={onBook}>
          Book &amp; pay
        </Button>
      )}
    </div>
  );
}
