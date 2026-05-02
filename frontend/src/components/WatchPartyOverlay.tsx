import { useEffect, useMemo, useState } from 'react';
import { WatchPartyClient, type WatchPartyEvent } from '../services/watchParty';

type Props = {
  roomId: string;
  userId: string;
  onRemoteSync: (positionS: number, isPlaying: boolean) => void;
  getLocalState: () => { positionS: number; isPlaying: boolean };
};

export const WatchPartyOverlay = ({ roomId, userId, onRemoteSync, getLocalState }: Props) => {
  const [connected, setConnected] = useState(false);
  const client = useMemo(() => new WatchPartyClient(), []);

  useEffect(() => {
    client.connect(roomId, userId, (event: WatchPartyEvent) => {
      setConnected(true);
      onRemoteSync(event.position_s, event.is_playing);
    });
    return () => client.close();
  }, [client, roomId, userId, onRemoteSync]);

  return (
    <button
      className="rounded-xl bg-fuchsia-600 px-3 py-2 text-xs"
      onClick={() => {
        const current = getLocalState();
        client.sendSync(current.positionS, current.isPlaying);
      }}
    >
      {connected ? 'Watch Party: Connected' : 'Watch Party: Connecting...'}
    </button>
  );
};
