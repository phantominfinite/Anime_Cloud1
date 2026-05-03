import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

interface AnimeCardProps {
  mal_id: string;
  title: string;
  image: string;
  score?: number;
  year?: number;
}

export const AnimeCard = ({ mal_id, title, image, score, year }: AnimeCardProps) => {
  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="relative flex-none w-40 md:w-48 group"
    >
      <Link to={`/anime/${mal_id}`} className="block">
        <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-zinc-900 border border-white/5 group-hover:border-primary/50 transition-colors">
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-110"
            loading="lazy"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {score && (
            <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-bold text-yellow-400">
              <Star className="w-3 h-3 fill-yellow-400" />
              {score.toFixed(1)}
            </div>
          )}

          <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
            <p className="text-xs font-bold line-clamp-2 text-white leading-snug">
              {title}
            </p>
            <p className="mt-1 text-[10px] text-zinc-400">
              {year || 'N/A'}
            </p>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};
