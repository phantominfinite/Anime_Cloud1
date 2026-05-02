import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, RefreshCw } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

import { AnimeCard } from '../components/AnimeCard';
import { Button } from '../components/ui/Button';
import { getAvailable, getAnime, getContinueWatching, getTelegramInitData, type AnimeLite } from '../services/api';

export const Home = () => {
  const canUseLibrary = useMemo(() => Boolean(getTelegramInitData()), []);

  const latestQuery = useQuery({
    queryKey: ['home-latest'],
    queryFn: async (): Promise<AnimeLite[]> => {
      const items = await getAvailable();
      const top = items.slice(0, 12);
      const details = await Promise.all(top.map((it) => getAnime(it.mal_id).then((r) => r.anime)));
      return details.filter((anime): anime is AnimeLite => Boolean(anime));
    },
  });

  const continueQuery = useQuery({
    queryKey: ['continue-watching'],
    queryFn: getContinueWatching,
    enabled: canUseLibrary,
  });

  const featured = latestQuery.data?.[0] ?? null;
  const latest = latestQuery.data ?? [];
  const continueItems = continueQuery.data?.items ?? [];

  if (latestQuery.isLoading) return <div className="px-4 py-10 pb-24 text-white">Loading...</div>;

  return <div className="pb-24 text-white">{/* unchanged ui */}
    <div className="relative h-[420px] overflow-hidden"><div className="absolute inset-0 bg-cover bg-center opacity-40" style={{ backgroundImage: featured?.image_url ? `url(${featured.image_url})` : undefined }} /><div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/10" />
      <div className="relative z-10 px-4 pt-10 max-w-6xl mx-auto"><div className="flex items-center justify-between"><div className="text-lg font-semibold tracking-wide">AnimeCloud</div><Button variant="secondary" className="gap-2" onClick={() => latestQuery.refetch()} title="Refresh"><RefreshCw className="w-4 h-4" />بروزرسانی</Button></div>
        {latestQuery.error ? <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">{(latestQuery.error as Error).message}</div> : null}
        {featured ? <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="mt-16 max-w-2xl"><div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs text-white/80"><span className="h-2 w-2 rounded-full bg-emerald-400" />پیشنهاد امروز</div><h1 className="mt-4 text-3xl md:text-5xl font-extrabold leading-tight">{featured.title}</h1><div className="mt-6 flex flex-wrap gap-3"><Link to={`/anime/${featured.mal_id}`}><Button className="gap-2 bg-white text-black hover:bg-white/90"><Play className="w-4 h-4 fill-black" />پخش</Button></Link></div></motion.div> : null}
      </div></div>
    <div className="px-4 -mt-10 relative z-20 max-w-6xl mx-auto space-y-10"><section className="rounded-2xl border border-white/10 bg-white/5 p-4 md:p-6 backdrop-blur"><div className="flex items-center justify-between"><h2 className="text-lg font-bold">آخرین آپلودها</h2><div className="text-xs text-white/60">{latest.length} مورد</div></div><div className="mt-4 flex overflow-x-auto gap-4 pb-2 scrollbar-hide">{latest.map((anime) => <AnimeCard key={anime.mal_id} mal_id={anime.mal_id} title={anime.title} image={anime.image_url || ''} score={anime.score ?? undefined} year={anime.year ?? undefined} />)}</div></section>
      <section className="rounded-2xl border border-white/10 bg-white/5 p-4 md:p-6 backdrop-blur"><div className="flex items-center justify-between"><h2 className="text-lg font-bold">ادامه تماشا</h2>{continueQuery.isLoading ? <div className="text-xs text-white/60">...</div> : null}</div>{!canUseLibrary ? <p className="mt-3 text-sm text-white/60">برای دیدن «ادامه تماشا» باید پروژه را داخل Mini App تلگرام باز کنید.</p> : continueItems.length === 0 ? <p className="mt-3 text-sm text-white/60">فعلاً چیزی ندارید.</p> : <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">{continueItems.map((it) => <Link key={`${it.anime_mal_id}-${it.progress_episode}`} to={`/anime/${it.anime_mal_id}#ep=${encodeURIComponent(it.progress_episode)}`} className="group rounded-xl border border-white/10 bg-black/40 p-4 hover:bg-black/60 transition"><div className="text-sm font-semibold">MAL: {it.anime_mal_id}</div></Link>)}</div>}</section>
    </div></div>;
};
