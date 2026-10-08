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
 * Back on expo-video's `nativeControls` after two failed custom-controls attempts, with one
 * concrete change: `allowsPictureInPicture` is gone. On iOS, enabling PiP on an
 * AVPlayerViewController-backed view (what nativeControls uses under the hood) adds an
 * internal AVFocusTensionGestureRecognizer, which is documented to conflict with other gesture
 * recognizers on the same view — including the player's own tap-to-toggle-controls gesture.
 * This video had allowsPictureInPicture enabled from the very first version of this file, so
 * it's the leading suspect for "controls work once, then stop responding to taps." Custom
 * controls were tried instead (twice): a PanResponder-based scrubber never received drag
 * touches at all, and a react-native-gesture-handler Gesture.Pan() version crashed natively —
 * this app's gesture-handler (2.28, pre-dates Reanimated 4 support) and Reanimated (4.1) are a
 * known-incompatible pairing; the gesture-handler version that supports Reanimated 4 needs
 * React Native 0.82+, and this app is on 0.81.5. If nativeControls is reliable without PiP,
 * that confirms the cause; PiP could then come back later as its own custom button once we're
 * not also fighting this class of bug.
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
      <VideoView player={player} style={{ width: '100%', height: '100%' }} contentFit="cover" nativeControls />
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
