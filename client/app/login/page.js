import LoginPanel from '../components/LoginPanel';
export default async function LoginPage({ searchParams }) {
  const params = await searchParams;
  const returnTo = typeof params?.returnTo === 'string' ? params.returnTo : '/dashboard';
  return <main className="page pageNarrow authPage"><LoginPanel returnTo={returnTo} error={Boolean(params?.error)} /></main>;
}
