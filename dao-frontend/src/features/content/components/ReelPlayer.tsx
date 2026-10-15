import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect } from 'react';

/** One playing reel: autoplays on mount, loops, no native controls (tap handling lives in ReelItem). */
export function ReelPlayer({ uri, paused }: { uri: string; paused: boolean }) {
  const player = useVideoPlayer({ uri }, (p) => {
    p.loop = true;
    p.play();
  });

  useEffect(() => {
    try {
      if (paused) player.pause();
      else player.play();
    } catch {
      // player already released while the item scrolled away
    }
  }, [paused, player]);

  return <VideoView player={player} style={{ width: '100%', height: '100%' }} contentFit="cover" nativeControls={false} />;
}
