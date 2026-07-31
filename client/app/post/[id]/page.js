import Link from 'next/link';
import { notFound } from 'next/navigation';
import { absoluteMediaUrl, getPost } from '@/lib/api';
import { formatDate } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function PostPage({ params }) {
  const { id } = await params;
  const post = await getPost(id);

  if (!post) {
    notFound();
  }

  return (
    <main className="page pageNarrow">
      <p className="backLink">
        <Link href="/site/default">Назад к ленте</Link>
      </p>

      <article className="postArticle">
        <div className="postMeta">
          <span>{post.channel.title || 'Telegram-канал'}</span>
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
              Открыть в Telegram
            </a>
          </p>
        ) : null}
      </article>
    </main>
  );
}
