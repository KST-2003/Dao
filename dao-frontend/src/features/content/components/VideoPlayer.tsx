import { Feather } from '@expo/vector-icons';
import { useEvent } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect, useRef } from 'react';
import { Pressable, View } from 'react-native';
import { DAOImage } from '@/shared/components';
import { ratios, media } from '@/shared/theme';

/**
 * Streams HLS/MP4 via expo-video (never downloads the whole file). Fires `onCompleted` once
 * when playback reaches the end (analytics: video_completed).
 */
export function VideoPlayer({ uri, poster, onCompleted }: { uri: string; poster: string | null; onCompleted?: () => void }) {
  const done = useRef(false);
  const player = useVideoPlayer({ uri }, (p) => {
    p.loop = false;
    p.timeUpdateEventInterval = 1;
  });
  const { isPlaying } = useEvent(player, 'playingChange', { isPlaying: player.playing });
  const { status } = useEvent(player, 'statusChange', { status: player.status });

  useEffect(() => {
    const sub = player.addListener('playToEnd', () => {
      if (!done.current) {
        done.current = true;
        onCompleted?.();
      }
    });
    return () => sub.remove();
  }, [player, onCompleted]);

  return (
    <View style={{ width: '100%', aspectRatio: ratios.video, backgroundColor: media.midnight }}>
      {status !== 'readyToPlay' && !isPlaying ? <DAOImage uri={poster} style={{ position: 'absolute', width: '100%', height: '100%' }} /> : null}
      <VideoView player={player} style={{ width: '100%', height: '100%' }} contentFit="cover" nativeControls allowsFullscreen allowsPictureInPicture />
      {!isPlaying ? (
        <Pressable accessibilityRole="button" accessibilityLabel="play" onPress={() => player.play()} style={{ position: 'absolute', alignSelf: 'center', top: '45%', width: 64, height: 64, borderRadius: 32, backgroundColor: media.textMuted, alignItems: 'center', justifyContent: 'center' }}>
          <Feather name="play" size={26} color={media.glassIcon} />
        </Pressable>
      ) : null}
    </View>
  );
}
