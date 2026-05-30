'use server';

import { redirect } from 'next/navigation';
import { createChannelRequest } from '@/lib/api';

export async function submitChannelRequest(formData) {
  const telegramChannel = String(formData.get('telegramChannel') || '').trim();
  const email = String(formData.get('email') || '').trim();
  const comment = String(formData.get('comment') || '').trim();

  const result = await createChannelRequest({
    telegramChannel,
    email,
    comment,
  });

  if (!result.ok) {
    redirect(`/add-channel?status=error&message=${encodeURIComponent(result.error || 'Request failed')}`);
  }

  redirect('/add-channel?status=success');
}
