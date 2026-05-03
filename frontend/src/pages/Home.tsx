import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, TrendingUp, Clock, ChevronRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

import { AnimeCard } from '../components/AnimeCard';
import { AnimeCardSkeleton, Skeleton } from '../components/ui/Skeleton';
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
    staleTime: 5 * 60 * 1000,
  });

  const continueQuery = useQuery({
    queryKey: ['continue-watching'],
    queryFn: getContinueWatching,
    enabled: canUseLibrary,
  });

  const featured = latestQuery.data?.[0] ?? null;
  const latest = latestQuery.data ?? [];
  const continueItems = continueQuery.data?.items ?? [];

  return (
    <div className="pb-32 min-h-screen bg-dark">
      {/* Hero Section */}
      <section className="relative h-[85vh] w-full overflow-hidden">
        {latestQuery.isLoading ? (
          <Skeleton className="h-full w-full rounded-none" />
        ) : featured ? (
          <>
            <motion.div
              initial={{ scale: 1.1, opacity: 0 }}
              animate={{ scale: 1, opacity: 0.5 }}
              transition={{ duration: 1.5 }}
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${featured.image_url})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-dark via-dark/40 to-transparent" />

            <div className="relative h-full z-10 px-6 flex flex-col justify-end pb-24 max-w-7xl mx-auto w-full">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.8 }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <span className="px-3 py-1 rounded-full bg-primary/20 border border-primary/30 text-primary text-xs font-bold flex items-center gap-1.5">
                    <TrendingUp className="w-3 h-3" />
                    TRENDING NOW
                  </span>
                </div>
                <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tight max-w-4xl text-glow">
                  {featured.title}
                </h1>
                <p className="text-zinc-400 text-lg md:text-xl mb-8 max-w-2xl line-clamp-3 font-medium">
                  {featured.description || "Immerse yourself in the breathtaking world of high-quality anime streaming."}
                </p>
                <div className="flex flex-wrap gap-4">
                  <Link to={`/anime/${featured.mal_id}`}>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="btn-primary flex items-center gap-2 text-lg"
                    >
                      <Play className="w-5 h-5 fill-current" />
                      Watch Now
                    </motion.button>
                  </Link>
                  <Link to={`/anime/${featured.mal_id}`}>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-8 py-2.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 font-semibold hover:bg-white/20 transition-all text-lg"
                    >
                      Details
                    </motion.button>
                  </Link>
                </div>
              </motion.div>
            </div>
          </>
        ) : null}
      </section>

      <div className="px-6 -mt-16 relative z-20 space-y-16 max-w-7xl mx-auto">
        {/* Continue Watching */}
        {canUseLibrary && (continueItems.length > 0 || continueQuery.isLoading) && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Clock className="w-6 h-6 text-secondary" />
                Continue Watching
              </h2>
            </div>
            <div className="flex overflow-x-auto gap-6 pb-4 scrollbar-hide">
              {continueQuery.isLoading
                ? [...Array(4)].map((_, i) => <AnimeCardSkeleton key={i} />)
                : continueItems.map((it) => (
                    <Link
                      key={`${it.anime_mal_id}-${it.progress_episode}`}
                      to={`/anime/${it.anime_mal_id}#ep=${encodeURIComponent(it.progress_episode)}`}
                      className="flex-none"
                    >
                      <div className="w-64 glass-card p-4 hover:border-primary/50 transition-all group">
                         <div className="flex gap-4">
                           <div className="w-16 h-20 rounded-lg bg-zinc-800 flex-none overflow-hidden">
                              <img src={`https://cdn.myanimelist.net/images/anime/11/${it.anime_mal_id}.jpg`} alt="" className="w-full h-full object-cover" />
                           </div>
                           <div className="flex flex-col justify-center">
                              <p className="font-bold text-sm line-clamp-1">MAL ID: {it.anime_mal_id}</p>
                              <p className="text-xs text-primary mt-1">Episode {it.progress_episode}</p>
                              <div className="w-full h-1 bg-zinc-800 rounded-full mt-3 overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: '65%' }}
                                  className="h-full bg-primary"
                                />
                              </div>
                           </div>
                         </div>
                      </div>
                    </Link>
                  ))
              }
            </div>
          </section>
        )}

        {/* Latest Uploads */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-black tracking-tight">LATEST RELEASES</h2>
              <div className="h-1.5 w-12 bg-primary rounded-full mt-2" />
            </div>
            <button className="text-zinc-500 hover:text-primary transition-colors flex items-center gap-1 font-bold text-sm">
              VIEW ALL <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-y-10 gap-x-6">
            {latestQuery.isLoading
              ? [...Array(12)].map((_, i) => <AnimeCardSkeleton key={i} />)
              : latest.map((anime) => (
                  <AnimeCard
                    key={anime.mal_id}
                    mal_id={anime.mal_id}
                    title={anime.title}
                    image={anime.image_url || ''}
                    score={anime.score ?? undefined}
                    year={anime.year ?? undefined}
                  />
                ))
            }
          </div>
        </section>
      </div>
    </div>
  );
};
