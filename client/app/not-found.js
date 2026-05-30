import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="page pageNarrow">
      <article className="postArticle">
        <h1>Post not found</h1>
        <p className="muted">There is no post with this id.</p>
        <p className="backLink">
          <Link href="/">Back to posts</Link>
        </p>
      </article>
    </main>
  );
}
