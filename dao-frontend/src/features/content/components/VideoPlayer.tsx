import { Feather } from '@expo/vector-icons';
import { useEvent } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { DAOImage } from '@/shared/components';
import { ratios, media } from '@/shared/theme';

/**
 * Streams HLS/MP4 via expo-video (never downloads the whole file). Fires `onCompleted` once
 * when playback reaches the end (analytics: video_completed).
 *
 * The poster + custom play button are only the cold-start affordance (nativeControls has no
 * visible UI until the player has rendered a frame). Once playback has started, they're gone
 * for good — leaving them tied to "currently paused" instead would re-overlay our Pressable
 * on top of nativeControls' own play/pause button every time the video pauses, which eats
 * the tap that's supposed to toggle the native control bar (that's why it "doesn't appear
 * sometimes" when tapping the video — our view was stealing the touch).
 */
export function VideoPlayer({ uri, poster, onCompleted }: { uri: string; poster: string | null; onCompleted?: () => void }) {
  const done = useRef(false);
  const [started, setStarted] = useState(false);
  const player = useVideoPlayer({ uri }, (p) => {
    p.loop = false;
    p.timeUpdateEventInterval = 1;
  });
  const { isPlaying } = useEvent(player, 'playingChange', { isPlaying: player.playing });

  useEffect(() => {
    if (isPlaying) {
      setStarted(true);
    }
  }, [isPlaying]);

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
      {/* allowsFullscreen dropped: it's deprecated in favor of fullscreenOptions, and its default (true) is already what we want. */}
      <VideoView player={player} style={{ width: '100%', height: '100%' }} contentFit="cover" nativeControls allowsPictureInPicture />
      {!started ? (
        <>
          <DAOImage uri={poster} style={{ position: 'absolute', width: '100%', height: '100%' }} />
          <Pressable accessibilityRole="button" accessibilityLabel="play" onPress={() => player.play()} style={{ position: 'absolute', alignSelf: 'center', top: '45%', width: 64, height: 64, borderRadius: 32, backgroundColor: media.textMuted, alignItems: 'center', justifyContent: 'center' }}>
            <Feather name="play" size={26} color={media.glassIcon} />
          </Pressable>
        </>
      ) : null}
    </View>
  );
}
