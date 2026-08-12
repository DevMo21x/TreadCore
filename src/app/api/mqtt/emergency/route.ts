export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { initMqtt, getMessageStore } from '@/lib/mqtt/provider';
import { TOPICS } from '@/lib/mqtt/topics';

export function GET() {
  initMqtt();
  const value = getMessageStore()[TOPICS.emergency];
  if (value === undefined) {
    return NextResponse.json({ error: 'No emergency message received' }, { status: 503 });
  }
  return NextResponse.json({ emergency: value });
}
