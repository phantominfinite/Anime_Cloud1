import { useEffect, useState } from 'react';
import { PageShell } from '../components/PageShell';

export default function Dashboard() {
  const [data, setData] = useState<{ ok?: boolean; stats?: { library_count?: number; favorites?: number; completed?: number } } | null>(null);

  useEffect(() => {
    fetch('/api/user/dashboard', { headers: { Authorization: `Bearer ${localStorage.getItem('access_token') || ''}` } })
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData({ ok: false }));
  }, []);

  return (
    <PageShell>
      <section className="mx-auto max-w-6xl p-6">
        <h1 className="mb-4 bg-gradient-to-r from-fuchsia-400 to-cyan-300 bg-clip-text text-4xl font-bold text-transparent">Your Dashboard</h1>
        {!data ? <div className="text-zinc-400">Loading immersive analytics...</div> : (
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5">Library: {data?.stats?.library_count ?? 0}</div>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5">Favorites: {data?.stats?.favorites ?? 0}</div>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5">Completed: {data?.stats?.completed ?? 0}</div>
          </div>
        )}
      </section>
    </PageShell>
  );
}
