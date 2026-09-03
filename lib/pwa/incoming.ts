export const INCOMING_PUSH_TYPES = [
  'order',
  'booking',
  'admin_order',
  'admin_booking',
] as const;

export type IncomingPushType = (typeof INCOMING_PUSH_TYPES)[number];

export function isIncomingPushType(type: string | undefined | null): type is IncomingPushType {
  return Boolean(type && (INCOMING_PUSH_TYPES as readonly string[]).includes(type));
}

export type IncomingPushPayload = {
  title?: string;
  body?: string;
  url?: string;
  type?: string;
  tag?: string;
};

export const FOREGROUND_PUSH_EVENT = 'shiqueen:incoming-push';
