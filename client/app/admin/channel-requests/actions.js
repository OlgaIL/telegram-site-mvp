'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { completeChannelRequest, getMeWithCookie } from '@/lib/api';

export async function connectChannel(formData) {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();
  const account = await getMeWithCookie(cookieHeader).catch(() => null);

  if (!account?.user?.isAdmin) {
    redirect('/login');
  }

  const requestId = String(formData.get('requestId') || '');
  const channelId = String(formData.get('channelId') || '');
  const basePath = '/admin/channel-requests';

  if (formData.get('confirmed') !== 'yes') {
    redirect(`${basePath}?error=${encodeURIComponent('Подтвердите выбор канала.')}`);
  }

  const result = await completeChannelRequest({ requestId, channelId, cookieHeader });

  if (!result.ok) {
    redirect(`${basePath}?error=${encodeURIComponent(result.error)}`);
  }

  redirect(`${basePath}?connected=${encodeURIComponent(result.site.url)}`);
}
