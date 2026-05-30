import Link from 'next/link';
import { getChannelRequests } from '@/lib/api';
import { formatDate } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function ChannelRequestsAdminPage() {
  const data = await getChannelRequests();
  const requests = data?.items || [];

  return (
    <main className="page">
      <p className="backLink">
        <Link href="/">Back to site search</Link>
      </p>

      <header className="siteHeader">
        <p className="eyebrow">Internal draft</p>
        <h1>Channel requests</h1>
        <p>This is a temporary internal page. Authorization and request management will be added later.</p>
      </header>

      <section className="lookupResult internalNotice">
        <h2>Internal page</h2>
        <p className="muted">This route is not part of the public user flow yet.</p>
      </section>

      {requests.length === 0 ? (
        <section className="lookupResult">
          <h2>No requests yet</h2>
          <p className="muted">New channel requests will appear here after users submit the add channel form.</p>
        </section>
      ) : (
        <section className="adminList" aria-label="Channel requests">
          {requests.map((request) => (
            <article className="adminCard" key={request.id}>
              <div className="adminCardHeader">
                <div>
                  <h2>{request.telegramChannel}</h2>
                  <p className="muted">{request.email}</p>
                </div>
                <span className="statusBadge">{request.status}</span>
              </div>

              {request.comment ? <p className="postText">{request.comment}</p> : null}

              <p className="muted">Created: {formatDate(request.createdAt)}</p>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
