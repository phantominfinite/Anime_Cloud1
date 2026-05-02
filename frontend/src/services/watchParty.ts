export type WatchPartyEvent = {
  type: 'sync' | 'state';
  position_s: number;
  is_playing: boolean;
  updated_at?: number;
  by?: string;
};

export class WatchPartyClient {
  private ws: WebSocket | null = null;

  connect(roomId: string, userId: string, onEvent: (event: WatchPartyEvent) => void): void {
    this.ws = new WebSocket(`${window.location.origin.replace('http', 'ws')}/api/watch-party/${roomId}?user_id=${userId}`);
    this.ws.onmessage = (message) => onEvent(JSON.parse(message.data));
  }

  sendSync(position_s: number, is_playing: boolean): void {
    this.ws?.send(JSON.stringify({ position_s, is_playing }));
  }

  close(): void {
    this.ws?.close();
    this.ws = null;
  }
}
