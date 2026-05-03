import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, TrendingUp, Heart, Play, Activity, Star, Users } from 'lucide-react';
import { PageShell } from '../components/PageShell';

export default function Dashboard() {
  const [data, setData] = useState<{ ok?: boolean; stats?: { library_count?: number; favorites?: number; completed?: number }; recommendations?: any[] } | null>(null);

  useEffect(() => {
    fetch('/api/user/dashboard', { headers: { Authorization: `Bearer ${localStorage.getItem('access_token') || ''}` } })
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData({ ok: false }));
  }, []);

  const stats = [
    { label: 'Library Size', value: data?.stats?.library_count ?? 0, icon: LayoutDashboard, color: 'text-primary' },
    { label: 'Favorites', value: data?.stats?.favorites ?? 0, icon: Heart, color: 'text-secondary' },
    { label: 'Completed', value: data?.stats?.completed ?? 0, icon: Activity, color: 'text-accent' },
  ];

  return (
    <PageShell>
      <section className="mx-auto max-w-7xl px-6 pt-12 pb-32">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
             <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-2 text-glow">
               USER COMMAND <span className="text-primary">CENTER</span>
             </h1>
             <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Real-time engagement & viewing analytics</p>
          </div>
          <div className="flex items-center gap-4 bg-white/5 border border-white/10 px-6 py-4 rounded-3xl backdrop-blur-xl">
             <div className="flex -space-x-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-dark bg-zinc-800 overflow-hidden">
                    <img src={`https://i.pravatar.cc/100?u=${i}`} alt="" />
                  </div>
                ))}
             </div>
             <div className="text-right">
                <p className="text-[10px] font-black text-zinc-500 uppercase">Online Now</p>
                <p className="text-lg font-bold flex items-center justify-end gap-1.5">
                   <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                   1,284
                </p>
             </div>
          </div>
        </div>

        {!data ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 rounded-3xl bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            <div className="grid gap-8 md:grid-cols-3 mb-16">
              {stats.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="glass-card p-8 group hover:border-primary/50 transition-all cursor-default"
                >
                  <div className="flex items-center justify-between mb-4">
                     <stat.icon className={`w-8 h-8 ${stat.color}`} />
                     <TrendingUp className="w-4 h-4 text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <p className="text-4xl font-black mb-1 tracking-tighter">{stat.value}</p>
                  <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">{stat.label}</p>
                </motion.div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              {/* Main Feed */}
              <div className="lg:col-span-8 space-y-12">
                 <section>
                    <h2 className="text-2xl font-black mb-8 flex items-center gap-3">
                       <Play className="w-6 h-6 text-primary fill-primary" /> AI RECOMMENDATIONS
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                       <AnimatePresence>
                         {(data.recommendations || []).slice(0, 4).map((rec, i) => (
                           <motion.div
                             key={rec.mal_id}
                             initial={{ opacity: 0, x: -20 }}
                             animate={{ opacity: 1, x: 0 }}
                             transition={{ delay: i * 0.1 }}
                             className="glass-card overflow-hidden group flex h-32"
                           >
                              <div className="w-24 shrink-0 overflow-hidden">
                                 <img src={rec.image_url} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                              </div>
                              <div className="p-4 flex flex-col justify-center">
                                 <div className="flex items-center gap-1.5 text-yellow-500 mb-1">
                                    <Star className="w-3 h-3 fill-yellow-500" />
                                    <span className="text-[10px] font-black">{rec.score}</span>
                                 </div>
                                 <h4 className="font-bold text-sm line-clamp-2 leading-tight group-hover:text-primary transition-colors">{rec.title}</h4>
                                 <p className="text-[10px] text-zinc-500 font-bold mt-2 uppercase">{rec.type} • {rec.year}</p>
                              </div>
                           </motion.div>
                         ))}
                       </AnimatePresence>
                    </div>
                 </section>

                 <section className="glass-card p-10 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-3xl -mr-32 -mt-32 rounded-full" />
                    <div className="relative z-10">
                       <h3 className="text-3xl font-black mb-4 tracking-tighter italic">ELEVATE YOUR EXPERIENCE</h3>
                       <p className="text-zinc-400 font-medium max-w-lg mb-8 leading-relaxed">
                          Unlock premium features, exclusive HLS bitrates, and early access to new releases with the Cloud Elite pass.
                       </p>
                       <button className="btn-primary group-hover:px-12 transition-all duration-500">UPGRADE NOW</button>
                    </div>
                 </section>
              </div>

              {/* Sidebar */}
              <div className="lg:col-span-4 space-y-8">
                 <div className="glass-card p-6">
                    <h3 className="font-black text-sm mb-6 flex items-center gap-2 uppercase tracking-widest">
                       <Users className="w-4 h-4 text-accent" /> Watch Network
                    </h3>
                    <div className="space-y-6">
                       {[...Array(3)].map((_, i) => (
                         <div key={i} className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-zinc-800 border border-white/5 overflow-hidden shadow-lg">
                               <img src={`https://i.pravatar.cc/100?u=user${i}`} alt="" />
                            </div>
                            <div>
                               <p className="text-sm font-bold">Vanguard_{i+7}</p>
                               <p className="text-[10px] text-zinc-500 font-bold">Watching One Piece • Ep 1084</p>
                            </div>
                         </div>
                       ))}
                    </div>
                 </div>

                 <div className="glass-card p-6 bg-gradient-to-br from-primary/20 to-secondary/20 border-primary/20">
                    <h3 className="font-black text-sm mb-4 uppercase tracking-widest italic">Global Activity</h3>
                    <div className="h-40 flex items-end gap-2 px-2">
                       {[40, 70, 45, 90, 65, 80, 50, 95, 60, 85].map((h, i) => (
                         <motion.div
                           key={i}
                           initial={{ height: 0 }}
                           animate={{ height: `${h}%` }}
                           transition={{ delay: i * 0.05, duration: 1 }}
                           className="flex-1 bg-white/20 rounded-t-lg"
                         />
                       ))}
                    </div>
                 </div>
              </div>
            </div>
          </>
        )}
      </section>
    </PageShell>
  );
}
