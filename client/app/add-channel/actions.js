'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createChannelRequest } from '@/lib/api';

export async function submitChannelRequest(formData) {
  const cookieStore = await cookies();
  const telegramChannel = String(formData.get('telegramChannel') || '').trim();
  const email = String(formData.get('email') || '').trim();
  const comment = String(formData.get('comment') || '').trim();

  const result = await createChannelRequest({
    telegramChannel,
    email,
    comment,
    cookieHeader: cookieStore.toString(),
  });

  if (!result.ok) {
    redirect(`/add-channel?status=error&message=${encodeURIComponent(result.error || 'Заявка не сохранена')}`);
  }

  redirect('/dashboard?request=created');
}
