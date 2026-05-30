import Link from 'next/link';
import { notFound } from 'next/navigation';
import { absoluteMediaUrl, getSitePost } from '@/lib/api';
import { formatDate } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function SitePostPage({ params }) {
  const { slug, id } = await params;
  const data = await getSitePost(slug, id);

  if (!data) {
    notFound();
  }

  const { site, post } = data;

  return (
    <main className="page pageNarrow">
      <p className="backLink">
        <Link href={`/site/${site.slug}`}>Back to posts</Link>
      </p>

      <article className="postArticle">
        <div className="postMeta">
          <span>{post.channel.title || site.title || 'Telegram channel'}</span>
          <time dateTime={post.publishedAt || post.createdAt}>
            {formatDate(post.publishedAt || post.createdAt)}
          </time>
        </div>

        {post.content ? <p className="postText postTextLarge">{post.content}</p> : null}

        {post.media?.type === 'photo' && post.media.url ? (
          <img className="postImage" src={absoluteMediaUrl(post.media.url)} alt="" />
        ) : null}

        {post.originalUrl ? (
          <p className="postActions">
            <a href={post.originalUrl} target="_blank" rel="noreferrer">
              Open in Telegram
            </a>
          </p>
        ) : null}
      </article>
    </main>
  );
}
