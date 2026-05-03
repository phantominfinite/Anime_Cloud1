import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import Plyr, { type APITypes } from 'plyr-react';
import 'plyr-react/plyr.css';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, ListVideo, TimerReset, Users, Star, Info, Share2, Heart, Send } from 'lucide-react';
import { WatchPartyOverlay } from '../components/WatchPartyOverlay';
import { usePlayerStore } from '../store/usePlayerStore';
import { Skeleton } from '../components/ui/Skeleton';

import { getAnime, getComments, postComment, likeComment, updateProgress, getTelegramInitData } from '../services/api';

type AnimeLite = {
  mal_id: string;
  title: string;
  image_url?: string | null;
  score?: number | null;
  year?: number | null;
  description?: string | null;
  type?: string | null;
};

type Episode = { episode_number: string; label?: string | null; quality?: string | null; url: string };

export const Watch = () => {
  const { id } = useParams<{ id: string }>();
  const [currentEp, setCurrentEp] = useState<Episode | null>(null);
  const [commentText, setCommentText] = useState('');

  const playerRef = useRef<APITypes>(null);
  const initData = useMemo(() => getTelegramInitData(), []);
  const roomId = useMemo(() => `anime-${id || 'global'}`, [id]);
  const setFloatingPlayer = usePlayerStore((state) => state.setFloatingPlayer);

  const animeQuery = useQuery({
    queryKey: ['watch-anime', id],
    queryFn: () => getAnime(id as string),
    enabled: Boolean(id),
  });

  const selectEpisodeFromHash = (eps: Episode[]) => {
    const hash = window.location.hash || '';
    const m = /ep=([^&]+)/.exec(hash.replace('#', ''));
    if (m) {
      const epId = decodeURIComponent(m[1]);
      const found = eps.find((e) => e.episode_number === epId) || eps.find((e) => e.label === epId);
      if (found) return found;
    }
    return eps[0] || null;
  };

  useEffect(() => {
    if (animeQuery.data?.episodes) {
      setCurrentEp(selectEpisodeFromHash(animeQuery.data.episodes));
    }
  }, [animeQuery.data]);

  const commentsQuery = useQuery({
    queryKey: ['comments', id],
    queryFn: async () => {
      const res = await getComments(id as string);
      return res.items || res.comments || [];
    },
    enabled: Boolean(id),
    refetchInterval: 10000,
  });

  const comments = commentsQuery.data ?? [];

  useEffect(() => {
    if (!id || !currentEp) return;
    const interval = setInterval(() => {
      try {
        const plyr = playerRef.current?.plyr;
        if (plyr && initData && plyr.currentTime > 1) {
          updateProgress(id, currentEp.episode_number, plyr.currentTime).catch(() => {});
        }
      } catch {}
    }, 8000);
    return () => clearInterval(interval);
  }, [id, currentEp, initData]);

  const playerSource = useMemo(() => {
    if (!currentEp) return null;
    return {
      type: 'video',
      title: currentEp.label || `Episode ${currentEp.episode_number}`,
      sources: [
        {
          src: currentEp.url.includes('/stream/') ? currentEp.url.replace('/stream/', '/stream/hls/') + '/master.m3u8' : currentEp.url,
          type: 'application/x-mpegURL',
        },
      ],
    };
  }, [currentEp]);

  const queryClient = useQueryClient();
  const commentMutation = useMutation({
    mutationFn: async () => postComment(id as string, 'Anonymous', commentText.trim()),
    onSuccess: async () => {
      setCommentText('');
      await queryClient.invalidateQueries({ queryKey: ['comments', id] });
    },
  });

  const likeMutation = useMutation({
    mutationFn: likeComment,
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['comments', id] }); },
  });

  const submitComment = async () => {
    if (!id || !commentText.trim()) return;
    await commentMutation.mutateAsync();
  };

  if (animeQuery.isLoading) return (
    <div className="max-w-7xl mx-auto px-6 pt-12 space-y-8">
      <Skeleton className="h-24 w-1/2" />
      <Skeleton className="aspect-video w-full" />
    </div>
  );

  if (!animeQuery.data?.anime) return <div className="p-12 text-center text-zinc-500">Anime not found.</div>;

  const anime = animeQuery.data.anime as AnimeLite;
  const episodes = animeQuery.data.episodes as Episode[];

  return (
    <div className="pb-32 bg-dark min-h-screen">
      {/* Immersive Header Backdrop */}
      <div className="fixed top-0 left-0 right-0 h-[50vh] z-0 opacity-20 pointer-events-none">
        <img src={anime.image_url || ''} className="w-full h-full object-cover blur-3xl" alt="" />
        <div className="absolute inset-0 bg-gradient-to-b from-dark/0 via-dark/50 to-dark" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 pt-12">
        {/* Info Header */}
        <div className="flex flex-col md:flex-row items-end gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-32 h-44 md:w-40 md:h-56 rounded-2xl overflow-hidden shadow-2xl border border-white/10 shrink-0"
          >
            <img src={anime.image_url || ''} alt={anime.title} className="w-full h-full object-cover" />
          </motion.div>
          <div className="flex-1">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl md:text-5xl font-black mb-4 leading-tight text-glow"
            >
              {anime.title}
            </motion.h1>
            <div className="flex flex-wrap items-center gap-4 text-zinc-400 font-bold text-sm">
              <span className="flex items-center gap-1 text-yellow-400 bg-yellow-400/10 px-2 py-1 rounded-lg">
                <Star className="w-4 h-4 fill-yellow-400" />
                {anime.score || 'N/A'}
              </span>
              <span>{anime.year}</span>
              <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 uppercase tracking-wider text-[10px]">
                {anime.type}
              </span>
              <div className="flex items-center gap-2 ml-auto">
                <button className="p-2.5 rounded-full glass-card hover:text-secondary transition-colors"><Heart className="w-5 h-5" /></button>
                <button className="p-2.5 rounded-full glass-card hover:text-accent transition-colors"><Share2 className="w-5 h-5" /></button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Player Section */}
          <div className="lg:col-span-8 space-y-6">
            <div className="video-container group relative">
              {playerSource ? (
                <Plyr
                  ref={playerRef}
                  source={playerSource as any}
                  options={{
                    autoplay: true,
                    quality: { default: 1080, options: [1080, 720, 480], forced: true, onChange: () => {} }
                  }}
                />
              ) : (
                <div className="aspect-video glass-card flex items-center justify-center text-zinc-500 font-medium italic">
                  Select an episode to start streaming
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-3 p-4 glass-card">
              <button
                onClick={() => { playerRef.current?.plyr?.forward(90); }}
                className="px-4 py-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all text-sm font-bold flex items-center gap-2"
              >
                <TimerReset className="w-4 h-4 text-primary" /> Skip Intro
              </button>
              <button
                onClick={() => currentEp && anime && setFloatingPlayer({ src: currentEp.url, title: anime.title, animeId: anime.mal_id })}
                className="px-4 py-2 rounded-xl bg-primary/10 border border-primary/20 hover:bg-primary/20 transition-all text-sm font-bold text-primary flex items-center gap-2"
              >
                Picture-in-Picture
              </button>

              <div className="h-8 w-px bg-white/10 mx-2" />

              <div className="flex items-center gap-2 text-zinc-400 font-bold text-xs uppercase tracking-widest">
                <Users className="w-4 h-4" /> Watch Party
                <WatchPartyOverlay
                  roomId={roomId}
                  userId={(anime?.mal_id || 'guest') + '-' + Math.random().toString(36).substr(2, 4)}
                  getLocalState={() => ({
                    positionS: playerRef.current?.plyr?.currentTime || 0,
                    isPlaying: !(playerRef.current?.plyr?.paused ?? true),
                  })}
                  onRemoteSync={(positionS, isPlaying) => {
                    const plyr = playerRef.current?.plyr;
                    if (!plyr) return;
                    if (Math.abs((plyr.currentTime || 0) - positionS) > 2.5) plyr.currentTime = positionS;
                    isPlaying ? plyr.play() : plyr.pause();
                  }}
                />
              </div>
            </div>

            {/* Description */}
            <div className="glass-card p-6">
               <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                 <Info className="w-5 h-5 text-primary" /> Synopsis
               </h3>
               <p className="text-zinc-400 leading-relaxed font-medium">
                 {anime.description || 'No description available.'}
               </p>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-8">
            {/* Episodes */}
            <div className="glass-card flex flex-col h-[500px]">
              <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
                <h3 className="font-black flex items-center gap-2 uppercase tracking-tight">
                  <ListVideo className="w-5 h-5 text-primary" /> Episodes
                </h3>
                <span className="text-[10px] font-bold text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded uppercase">
                  {episodes.length} Available
                </span>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-hide">
                {episodes.map((ep) => {
                  const isActive = currentEp?.episode_number === ep.episode_number;
                  return (
                    <button
                      key={`${ep.episode_number}-${ep.quality}`}
                      onClick={() => setCurrentEp(ep)}
                      className={`w-full text-left p-3 rounded-xl border transition-all duration-300 group ${
                        isActive
                          ? 'bg-primary/20 border-primary shadow-glow-primary text-white'
                          : 'bg-white/5 border-transparent hover:bg-white/10 hover:border-white/10 text-zinc-400'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold">{ep.label || `Episode ${ep.episode_number}`}</span>
                        {ep.quality && <span className="text-[10px] opacity-60 font-black">{ep.quality}</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Comments */}
            <div className="glass-card flex flex-col h-[500px]">
              <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
                <h3 className="font-black flex items-center gap-2 uppercase tracking-tight">
                  <MessageCircle className="w-5 h-5 text-secondary" /> Community
                </h3>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
                <AnimatePresence initial={false}>
                  {comments.map((c) => (
                    <motion.div
                      key={c.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-4 rounded-2xl bg-white/5 border border-white/5"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-black text-primary uppercase tracking-tighter">{c.user || 'Anonymous'}</span>
                        <button
                          onClick={() => likeMutation.mutate(c.id)}
                          className="text-[10px] font-bold bg-secondary/10 text-secondary px-2 py-1 rounded-lg hover:bg-secondary/20 transition-all"
                        >
                          ❤ {c.likes}
                        </button>
                      </div>
                      <p className="text-sm text-zinc-300 font-medium leading-relaxed">{c.text}</p>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {comments.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-zinc-600 gap-2">
                    <MessageCircle className="w-12 h-12 opacity-20" />
                    <p className="text-sm font-bold italic">No comments yet. Start the conversation!</p>
                  </div>
                )}
              </div>
              <div className="p-4 bg-white/5 space-y-3">
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Share your thoughts..."
                  className="w-full bg-dark border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-primary transition-all min-h-[80px] resize-none"
                />
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={submitComment}
                  disabled={commentMutation.isPending}
                  className="w-full py-2.5 rounded-xl bg-primary text-white font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-glow-primary"
                >
                  <Send className="w-3.5 h-3.5" /> Post Comment
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
