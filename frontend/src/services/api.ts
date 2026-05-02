import axios, { AxiosError } from 'axios';

interface TelegramWebApp {
  initData?: string;
}

interface TelegramRoot {
  WebApp?: TelegramWebApp;
}

interface TelegramWindow extends Window {
  Telegram?: TelegramRoot;
}

interface ImportMetaEnvWithApi {
  VITE_API_BASE?: string;
}

export const getTelegramInitData = (): string => {
  const tgWindow = window as TelegramWindow;
  return tgWindow.Telegram?.WebApp?.initData ?? '';
};

const env = import.meta.env as ImportMetaEnvWithApi;
const API_BASE = env.VITE_API_BASE || '/api';

const api = axios.create({ baseURL: API_BASE, timeout: 20000 });
export const jikanApi = axios.create({ baseURL: 'https://api.jikan.moe/v4', timeout: 20000 });

api.interceptors.request.use((config) => {
  const initData = getTelegramInitData();
  if (initData) {
    config.headers = config.headers || {};
    config.headers['X-Telegram-Init-Data'] = initData;
  }
  return config;
});

type ErrorPayload = { detail?: string; error?: string };
const normalizeError = (e: unknown): Error => {
  if (axios.isAxiosError(e)) {
    const err = e as AxiosError<ErrorPayload>;
    const msg = err.response?.data?.detail || err.response?.data?.error || err.message || 'Request failed';
    return new Error(msg);
  }
  return e instanceof Error ? e : new Error('Unknown error');
};

export type AvailableAnime = { mal_id: string; episodes: number };
export type AnimeLite = { mal_id: string; title: string; image_url?: string | null; score?: number | null; type?: string | null; year?: number | null; description?: string | null };
export type Episode = { episode_number: string; label?: string | null; quality?: string | null; url: string };
export type AnimeWithEpisodes = { anime: AnimeLite; episodes: Episode[] };
export type CommentItem = { id: number; user?: string; user_name?: string; text: string; likes: number; date?: string };
export type CommentsResponse = { items?: CommentItem[]; comments?: CommentItem[] };
export type ContinueItem = { anime_mal_id: string; progress_episode: string; progress_time?: number | null; status?: string };
export type ContinueResponse = { items: ContinueItem[] };
export type MeResponse = { user?: { first_name?: string; username?: string; telegram_id?: string; is_admin?: boolean } };

type JikanAnimeImage = { jpg?: { large_image_url?: string } };
export type JikanAnime = { mal_id: number; title: string; image_url?: string; images?: JikanAnimeImage; score?: number | null };
export type SearchFilters = { status?: string; type?: string };

export const getAvailable = async (): Promise<AvailableAnime[]> => (await api.get<{ items: AvailableAnime[] }>('/anime/available')).data.items || [];
export const getAnime = async (malId: string): Promise<AnimeWithEpisodes> => (await api.get<AnimeWithEpisodes>(`/anime/${malId}`)).data;
export const getAnimeEpisodes = async (malId: string): Promise<Episode[]> => (await api.get<Episode[]>(`/anime/${malId}/episodes`)).data || [];

export const getComments = async (malId: string): Promise<CommentsResponse> => {
  try { return (await api.get<CommentsResponse>(`/anime/${malId}/comments`)).data; } catch (e) { throw normalizeError(e); }
};
export const postComment = async (malId: string, user_name: string, text: string): Promise<{ ok: boolean }> => {
  try { return (await api.post<{ ok: boolean }>(`/anime/${malId}/comments`, { user_name, text })).data; } catch (e) { throw normalizeError(e); }
};
export const likeComment = async (commentId: number): Promise<{ ok: boolean; likes: number }> => {
  try { return (await api.post<{ ok: boolean; likes: number }>(`/comments/${commentId}/like`)).data; } catch (e) { throw normalizeError(e); }
};
export const getMe = async (): Promise<MeResponse> => {
  try { return (await api.get<MeResponse>('/user/me')).data; } catch (e) { throw normalizeError(e); }
};
export const getLibrary = async (): Promise<unknown> => {
  try { return (await api.get('/user/library')).data; } catch (e) { throw normalizeError(e); }
};
export const getContinueWatching = async (): Promise<ContinueResponse> => {
  try { return (await api.get<ContinueResponse>('/user/continue')).data; } catch (e) { throw normalizeError(e); }
};
export const updateProgress = async (animeMalId: string, episode: string, positionSec: number): Promise<{ ok: boolean }> => {
  try { return (await api.post<{ ok: boolean }>(`/user/progress/${animeMalId}/${episode}`, { progress_time: Math.floor(positionSec) })).data; } catch (e) { throw normalizeError(e); }
};

export const searchAnime = async (query: string, filters?: SearchFilters): Promise<JikanAnime[]> => {
  const params: { q: string; limit: number; status?: string; type?: string } = { q: query, limit: 20 };
  if (filters?.status) params.status = filters.status;
  if (filters?.type) params.type = filters.type;
  try {
    const res = await jikanApi.get<{ data: JikanAnime[] }>('/anime', { params });
    return res.data.data;
  } catch (e) {
    throw normalizeError(e);
  }
};

export default api;
