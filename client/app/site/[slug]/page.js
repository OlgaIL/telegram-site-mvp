import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getSitePosts } from '@/lib/api';
import SiteFeed from './SiteFeed';

export const dynamic = 'force-dynamic';

export default async function SitePage({ params }) {
  const { slug } = await params;
  const data = await getSitePosts(slug, { limit: 20 });

  if (!data) {
    notFound();
  }

  const posts = data.items || [];
  const site = data.site;

  return (
    <main className="page">
      <p className="backLink">
        <Link href="/">Найти другой канал</Link>
      </p>

      <header className="siteHeader">
        <p className="eyebrow">Сайт из Telegram-канала</p>
        <h1>{site.title || site.name}</h1>
        {site.description ? <p>{site.description}</p> : null}
      </header>

      <SiteFeed site={site} initialPosts={posts} limit={20} />
    </main>
  );
}
