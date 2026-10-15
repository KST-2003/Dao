import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect } from 'react';
import { View } from 'react-native';
import { ReelProgress } from './ReelProgress';

/** One playing reel: autoplays on mount, loops, no native controls (taps live in ReelItem, seeking in ReelProgress). */
export function ReelPlayer({ uri, paused, barBottom }: { uri: string; paused: boolean; barBottom: number }) {
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

  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
      <VideoView player={player} style={{ width: '100%', height: '100%' }} contentFit="cover" nativeControls={false} surfaceType="textureView" />
      <ReelProgress player={player} bottom={barBottom} />
    </View>
  );
}
