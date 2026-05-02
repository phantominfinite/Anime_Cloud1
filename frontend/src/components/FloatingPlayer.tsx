import { Minimize2, X } from 'lucide-react';
import { usePlayerStore } from '../store/usePlayerStore';

export const FloatingPlayer = () => {
  const { enabled, src, title, clearFloatingPlayer, setEnabled } = usePlayerStore();
  if (!enabled || !src) return null;

  return (
    <div className="fixed bottom-20 right-4 z-[60] w-72 overflow-hidden rounded-2xl border border-fuchsia-400/30 bg-black/90 shadow-2xl">
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-2 text-xs text-white/80">
        <span className="truncate">{title}</span>
        <div className="flex items-center gap-2">
          <button onClick={() => setEnabled(false)}><Minimize2 className="h-4 w-4" /></button>
          <button onClick={clearFloatingPlayer}><X className="h-4 w-4" /></button>
        </div>
      </div>
      <video className="h-40 w-full bg-black" src={src} controls autoPlay />
    </div>
  );
};
