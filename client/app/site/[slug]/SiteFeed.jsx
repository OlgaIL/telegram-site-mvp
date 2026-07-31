'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { absoluteMediaUrl } from '@/lib/api';
import { formatDate } from '@/lib/format';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';
const REFRESH_INTERVAL_MS = 10000;

function joinUrl(baseUrl, path) {
  return `${baseUrl.replace(/\/$/, '')}${path}`;
}

function samePosts(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

async function fetchSitePosts(slug, limit) {
  const response = await fetch(
    joinUrl(API_BASE_URL, `/api/sites/${encodeURIComponent(slug)}/posts?limit=${limit}`),
    { cache: 'no-store' },
  );

  if (!response.ok) {
    throw new Error(`Refresh failed: ${response.status}`);
  }

  return response.json();
}

export default function SiteFeed({ site, initialPosts, limit = 20 }) {
  const [posts, setPosts] = useState(initialPosts || []);
  const [refreshError, setRefreshError] = useState('');
  const [lastRefreshAt, setLastRefreshAt] = useState(null);

  const refreshUrl = useMemo(
    () => `/api/sites/${encodeURIComponent(site.slug)}/posts?limit=${limit}`,
    [site.slug, limit],
  );

  useEffect(() => {
    let isMounted = true;

    async function refreshPosts() {
      try {
        const data = await fetchSitePosts(site.slug, limit);

        if (!isMounted) {
          return;
        }

        setPosts((currentPosts) => {
          const nextPosts = data.items || [];

          if (samePosts(currentPosts, nextPosts)) {
            return currentPosts;
          }

          return nextPosts;
        });
        setRefreshError('');
        setLastRefreshAt(new Date());
      } catch (err) {
        if (isMounted) {
          setRefreshError('Не удалось обновить ленту.');
        }
      }
    }

    const timer = window.setInterval(refreshPosts, REFRESH_INTERVAL_MS);

    return () => {
      isMounted = false;
      window.clearInterval(timer);
    };
  }, [site.slug, limit, refreshUrl]);

  return (
    <>
      <div className="refreshStatus">
        <span>Лента обновляется каждые 10 секунд</span>
        {lastRefreshAt ? <span>Последняя проверка: {formatDate(lastRefreshAt.toISOString())}</span> : null}
        {refreshError ? <span className="refreshError">{refreshError}</span> : null}
      </div>

      <section className="postList" aria-label="Посты">
        {posts.length === 0 ? (
          <p className="muted">Постов пока нет.</p>
        ) : (
          posts.map((post) => (
            <article className="postCard" key={post.id}>
              <div className="postMeta">
                <span>{post.channel.title || 'Telegram-канал'}</span>
                <time dateTime={post.publishedAt || post.createdAt}>
                  {formatDate(post.publishedAt || post.createdAt)}
                </time>
              </div>

              {post.content ? <p className="postText">{post.content}</p> : null}

              {post.media?.type === 'photo' && post.media.url ? (
                <img className="postImage" src={absoluteMediaUrl(post.media.url)} alt="" />
              ) : null}

              <div className="postActions">
                <Link href={`/site/${site.slug}/post/${post.id}`}>Читать</Link>
                {post.originalUrl ? (
                  <a href={post.originalUrl} target="_blank" rel="noreferrer">
                    Открыть в Telegram
                  </a>
                ) : null}
              </div>
            </article>
          ))
        )}
      </section>
    </>
  );
}
