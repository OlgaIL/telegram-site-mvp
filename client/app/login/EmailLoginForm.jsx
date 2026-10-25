'use client';

import { useEffect, useId, useState } from 'react';
import { requestEmailCode, verifyEmailCode } from '@/lib/api';

function errorMessage(error) {
  switch (error.code) {
    case 'INVALID_EMAIL': return 'Проверьте адрес почты.';
    case 'EMAIL_AUTH_CODE_INVALID': return 'Код неверный или срок его действия истёк.';
    case 'EMAIL_AUTH_RATE_LIMITED': return 'Слишком много попыток. Попробуйте позже.';
    case 'EMAIL_AUTH_NOT_CONFIGURED': return 'Вход по почте временно недоступен.';
    case 'EMAIL_AUTH_DELIVERY_FAILED': return 'Не удалось отправить письмо. Попробуйте позже.';
    default: return 'Не удалось выполнить запрос. Попробуйте ещё раз.';
  }
}

export default function EmailLoginForm({ returnTo, onBusyChange }) {
  const id = useId();
  const [step, setStep] = useState('closed');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [resendAt, setResendAt] = useState(0);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    onBusyChange?.(pending);
    return () => onBusyChange?.(false);
  }, [pending, onBusyChange]);

  useEffect(() => {
    if (!resendAt) return undefined;
    const tick = () => setSeconds(Math.max(0, Math.ceil((resendAt - Date.now()) / 1000)));
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [resendAt]);

  function setRetry(secondsToWait) {
    const wait = Math.max(0, Number(secondsToWait) || 0);
    setSeconds(wait);
    setResendAt(Date.now() + wait * 1000);
  }

  async function sendCode(event) {
    event?.preventDefault();
    if (pending || seconds > 0) return;
    setPending(true);
    setError('');
    try {
      const result = await requestEmailCode(email.trim());
      setEmail(email.trim());
      setRetry(result.retryAfterSeconds);
      setCode('');
      setStep('code');
    } catch (err) {
      if (err.retryAfterSeconds) setRetry(err.retryAfterSeconds);
      setError(errorMessage(err));
    } finally {
      setPending(false);
    }
  }

  async function verify(event) {
    event.preventDefault();
    if (pending || code.length !== 6) return;
    setPending(true);
    setError('');
    try {
      const result = await verifyEmailCode({ email, code, returnTo });
      window.location.assign(result.returnTo);
    } catch (err) {
      setError(errorMessage(err));
      setPending(false);
    }
  }

  if (step === 'closed') {
    return (
      <button className="authButton emailLoginToggle" type="button" onClick={() => setStep('email')}>
        Войти по почте
      </button>
    );
  }

  return (
    <form className="emailLogin ym-hide-content" onSubmit={step === 'email' ? sendCode : verify} aria-busy={pending}>
      {step === 'email' ? (
        <>
          <label htmlFor={id + '-email'}>Ваша почта</label>
          <input
            id={id + '-email'}
            className="ym-disable-keys"
            type="email"
            autoComplete="email"
            autoFocus
            required
            maxLength={320}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={pending}
          />
          <button className="authButton" type="submit" disabled={pending || !email.trim() || seconds > 0}>
            {pending ? 'Отправляем…' : seconds > 0 ? 'Повторить через ' + seconds + ' с' : 'Получить код'}
          </button>
        </>
      ) : (
        <>
          <p className="emailLoginSent" role="status">Код отправлен на {email}</p>
          <label htmlFor={id + '-code'}>Код из письма</label>
          <input
            key="code"
            id={id + '-code'}
            className="ym-disable-keys"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            autoFocus
            pattern="[0-9]{6}"
            maxLength={6}
            required
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
            disabled={pending}
          />
          <button className="authButton" type="submit" disabled={pending || code.length !== 6}>
            {pending ? 'Проверяем…' : 'Войти'}
          </button>
          <button className="authButton" type="button" onClick={sendCode} disabled={pending || seconds > 0}>
            {seconds > 0 ? 'Отправить ещё раз через ' + seconds + ' с' : 'Отправить код ещё раз'}
          </button>
          <button
            className="authButton"
            type="button"
            disabled={pending}
            onClick={() => { setStep('email'); setCode(''); setError(''); setResendAt(0); setSeconds(0); }}
          >
            Изменить почту
          </button>
        </>
      )}
      <button className="linkButton" type="button" disabled={pending} onClick={() => { setStep('closed'); setError(''); }}>Другой способ входа</button>
      {error ? <p className="emailLoginError" role="alert">{error}</p> : null}
    </form>
  );
}
