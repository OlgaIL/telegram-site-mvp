import Link from 'next/link';
import { submitChannelRequest } from './actions';

export default async function AddChannelPage({ searchParams }) {
  const params = await searchParams;
  const status = params?.status;
  const message = params?.message;
  const channel = String(params?.channel || '').trim();
  const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || '@your_service_bot';

  return (
    <main className="page pageNarrow">
      <p className="backLink">
        <Link href="/">Back to search</Link>
      </p>

      <header className="siteHeader">
        <p className="eyebrow">Channel onboarding</p>
        <h1>Add your Telegram channel</h1>
        <p>Send a draft request. Later this flow will become registration and channel connection.</p>
      </header>

      <section className="lookupResult">
        <h2>Bot connection step</h2>
        <p className="muted">
          For MVP and future clients we use one service bot. After the request is accepted, add this bot as an admin
          in your Telegram channel:
        </p>
        <p className="botName">{botUsername}</p>
        <p className="muted">
          The bot needs access to new channel posts. We will detect the channel by Telegram chat id when the first post
          arrives.
        </p>
      </section>

      {status === 'success' ? (
        <section className="lookupResult lookupResultSuccess">
          <h2>Request received</h2>
          <p className="muted">We saved your channel request. This is a draft MVP flow, so no email is sent yet.</p>
        </section>
      ) : null}

      {status === 'error' ? (
        <section className="lookupResult lookupResultError">
          <h2>Request was not saved</h2>
          <p className="muted">{message || 'Please check the form and try again.'}</p>
        </section>
      ) : null}

      <form className="lookupForm" action={submitChannelRequest}>
        <label htmlFor="telegramChannel">Telegram channel</label>
        <input
          id="telegramChannel"
          name="telegramChannel"
          type="text"
          placeholder="@your_channel"
          defaultValue={channel}
          required
        />

        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          placeholder="you@example.com"
          required
        />

        <label htmlFor="comment">Comment</label>
        <textarea
          id="comment"
          name="comment"
          rows="4"
          placeholder="Anything useful for setup"
        />

        <button type="submit">Send request</button>
      </form>
    </main>
  );
}
