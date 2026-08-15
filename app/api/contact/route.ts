import { NextRequest, NextResponse } from 'next/server';
import { createContactMessageServer } from '@/lib/firebase/contact-messages';
import { notifyAdminContactMessage } from '@/lib/firebase/partner-alerts-server';
import { CONTACT_MESSAGE_TOPICS } from '@/lib/types/contact-messages';

const MAX_NAME = 120;
const MAX_EMAIL = 200;
const MAX_SUBJECT = 200;
const MAX_MESSAGE = 5000;

const ALLOWED_TOPICS = new Set(CONTACT_MESSAGE_TOPICS.map((topic) => topic.value));

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      name?: string;
      email?: string;
      topic?: string;
      subject?: string;
      message?: string;
    };

    const name = String(body.name ?? '').trim();
    const email = String(body.email ?? '').trim().toLowerCase();
    const topic = String(body.topic ?? 'general').trim() || 'general';
    const subject = String(body.subject ?? '').trim();
    const message = String(body.message ?? '').trim();

    if (!name || name.length > MAX_NAME) {
      return NextResponse.json({ error: 'Please enter a valid name.' }, { status: 400 });
    }
    if (!email || email.length > MAX_EMAIL || !isValidEmail(email)) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }
    if (!ALLOWED_TOPICS.has(topic as (typeof CONTACT_MESSAGE_TOPICS)[number]['value'])) {
      return NextResponse.json({ error: 'Please choose a valid topic.' }, { status: 400 });
    }
    if (!subject || subject.length > MAX_SUBJECT) {
      return NextResponse.json({ error: 'Please enter a subject.' }, { status: 400 });
    }
    if (!message || message.length > MAX_MESSAGE) {
      return NextResponse.json({ error: 'Please enter a message.' }, { status: 400 });
    }

    const created = await createContactMessageServer({
      name,
      email,
      topic,
      subject,
      message,
    });

    void notifyAdminContactMessage(created.id).catch((error) => {
      console.warn('[ShiQueen] Contact message FCM notify failed:', error);
    });

    return NextResponse.json({ ok: true, id: created.id });
  } catch (error) {
    console.error('[ShiQueen] contact API:', error);
    return NextResponse.json(
      { error: 'Could not send your message. Please try again.' },
      { status: 500 }
    );
  }
}
