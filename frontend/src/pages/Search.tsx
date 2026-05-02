import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchAnime } from '../services/api';
import { Search as SearchIcon, SlidersHorizontal, Star } from 'lucide-react';
import { VirtualGrid } from '../components/VirtualGrid';

const Search: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ status: '', type: '' });
  const [scrollTop, setScrollTop] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (query.length < 3) return;
      setLoading(true);
      try {
        const data = await searchAnime(query, filters);
        setResults(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [query, filters]);

  return (
    <div className="pb-20 pt-4 animate-slide-up" onScroll={(e) => setScrollTop((e.target as HTMLDivElement).scrollTop)}>
      <div className="glass sticky top-24 z-20 mb-6 flex items-center rounded-2xl p-2 shadow-xl">
        <div className="pl-4 pr-3 text-gray-400"><SearchIcon /></div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full border-none bg-transparent px-2 py-3 text-lg font-medium text-white placeholder-gray-500 focus:outline-none"
          placeholder="جستجوی پیشرفته انیمه..."
          autoFocus
        />
        <button onClick={() => setShowFilters(!showFilters)} className={`rounded-xl p-3 transition ${showFilters ? 'bg-primary text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'}`}>
          <SlidersHorizontal size={20} />
        </button>
      </div>

      {showFilters && (
        <div className="mb-8 grid grid-cols-2 gap-4 rounded-2xl border border-white/5 bg-surface p-5 text-sm animate-fade-in">
          <div>
            <label className="mb-2 block text-xs font-bold text-gray-500">وضعیت پخش</label>
            <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className="w-full appearance-none rounded-xl border border-white/10 bg-dark p-3 text-gray-300 outline-none focus:border-primary">
              <option value="">همه</option><option value="airing">در حال پخش</option><option value="complete">پایان یافته</option><option value="upcoming">به زودی</option>
            </select>
          </div>
          <div>
            <label className="mb-2 block text-xs font-bold text-gray-500">فرمت</label>
            <select value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })} className="w-full appearance-none rounded-xl border border-white/10 bg-dark p-3 text-gray-300 outline-none focus:border-primary">
              <option value="">همه</option><option value="tv">سریال</option><option value="movie">سینمایی</option>
            </select>
          </div>
        </div>
      )}

      {loading ? <div className="py-20 text-center">در حال جستجو...</div> : results.length > 0 ? (
        <VirtualGrid
          items={results}
          scrollTop={scrollTop}
          viewportHeight={800}
          rowHeight={320}
          renderItem={(anime) => (
            <div key={anime.mal_id} onClick={() => navigate(`/anime/${anime.mal_id}`)} className="group relative cursor-pointer animate-fade-in">
              <div className="relative mb-3 aspect-[2/3] overflow-hidden rounded-2xl border border-white/5">
                <img src={anime.images?.jpg?.large_image_url || anime.image_url} className="h-full w-full object-cover transition duration-500 group-hover:scale-110" loading="lazy" />
                <div className="absolute right-2 top-2 flex items-center gap-1 rounded-lg bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-md"><Star size={10} className="text-yellow-400" fill="currentColor" /> {anime.score || '?'}</div>
              </div>
              <h3 className="line-clamp-1 text-sm font-bold text-white transition group-hover:text-primary">{anime.title}</h3>
            </div>
          )}
        />
      ) : (
        <div className="py-20 text-center text-gray-500">نام انیمه را جستجو کنید...</div>
      )}
    </div>
  );
};

export default Search;
