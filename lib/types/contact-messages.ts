export const CONTACT_MESSAGE_TOPICS = [
  { value: 'general', label: 'General inquiry' },
  { value: 'order', label: 'Order support' },
  { value: 'services', label: 'List my services' },
  { value: 'wholesale', label: 'Wholesale & packages' },
  { value: 'advertise', label: 'Advertise with us' },
  { value: 'other', label: 'Something else' },
] as const;

export type ContactMessageTopic = (typeof CONTACT_MESSAGE_TOPICS)[number]['value'];

export type ContactMessageStatus = 'unread' | 'read' | 'archived';

export type ContactMessage = {
  id: string;
  name: string;
  email: string;
  topic: ContactMessageTopic | string;
  subject: string;
  message: string;
  status: ContactMessageStatus;
  createdAt: Date;
  updatedAt: Date;
};

export function contactTopicLabel(topic: string): string {
  return CONTACT_MESSAGE_TOPICS.find((item) => item.value === topic)?.label ?? topic;
}
