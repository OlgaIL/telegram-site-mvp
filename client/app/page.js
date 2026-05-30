import Link from 'next/link';
import { lookupChannel } from '@/lib/api';

export const dynamic = 'force-dynamic';

export default async function HomePage({ searchParams }) {
  const params = await searchParams;
  const query = String(params?.channel || '').trim();
  const result = query ? await lookupChannel(query) : null;

  return (
    <main className="page pageNarrow">
      <header className="siteHeader">
        <p className="eyebrow">Telegram to site</p>
        <h1>Find a Telegram channel site</h1>
        <p>Enter a Telegram channel username or title. If the channel is connected, we will open its public site.</p>
      </header>

      <form className="lookupForm" action="/" method="get">
        <label htmlFor="channel">Telegram channel</label>
        <div className="lookupRow">
          <input
            id="channel"
            name="channel"
            type="text"
            placeholder="@test_site_tele"
            defaultValue={query}
          />
          <button type="submit">Find</button>
        </div>
      </form>

      {result?.found ? (
        <section className="lookupResult lookupResultSuccess">
          <h2>{result.site.title || result.site.name}</h2>
          <p className="muted">
            Channel found: @{result.site.channel?.username || 'unknown'}
          </p>
          <p>
            <Link href={result.url}>Open channel site</Link>
          </p>
        </section>
      ) : null}

      {result && !result.found ? (
        <section className="lookupResult">
          <h2>Channel is not connected yet</h2>
          <p className="muted">This channel is not added to our system yet.</p>
          <p>
            <Link href={`/add-channel${query ? `?channel=${encodeURIComponent(query)}` : ''}`}>Add your channel</Link>
          </p>
        </section>
      ) : null}

      {!result ? (
        <section className="lookupResult">
          <h2>Try the demo</h2>
          <p className="muted">Use the connected test channel to see the current MVP site.</p>
          <p>
            <Link href="/site/default">Open demo site</Link>
          </p>
        </section>
      ) : null}

      <section className="lookupResult">
        <h2>Want to connect a channel?</h2>
        <p className="muted">Leave a draft request first. The bot connection step comes after we confirm the channel.</p>
        <p>
          <Link href={`/add-channel${query ? `?channel=${encodeURIComponent(query)}` : ''}`}>
            Add your channel
          </Link>
        </p>
      </section>
    </main>
  );
}
