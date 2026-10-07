import { Feather, MaterialIcons } from '@expo/vector-icons';
import { useEvent } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useTranslation } from 'react-i18next';
import { runOnJS } from 'react-native-reanimated';
import { DAOImage, DAOText } from '@/shared/components';
import { formatDuration } from '@/shared/utils/format';
import { ratios, useTheme, media } from '@/shared/theme';

const AUTO_HIDE_MS = 3000;
const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

/**
 * Drag-and-tap scrubber. Built on react-native-gesture-handler's Gesture API rather than core
 * React Native's PanResponder — nesting a PanResponder view inside a Pressable-based ancestor
 * (the tap-to-toggle-controls layer this sits under) made the drag simply never activate;
 * RNGH's gesture system is built specifically to arbitrate correctly against other gestures
 * (including Pressable, which itself is backed by RNGH under the hood in this app since
 * GestureHandlerRootView wraps the whole app in _layout.tsx) instead of the two independently
 * racing for the same touch. `minDistance(0)` makes a plain tap (no movement) activate it too,
 * not just a drag; `e.x` is the touch position relative to this view and — unlike
 * PanResponder's `locationX` — stays reliable throughout the whole gesture, not just at touch-
 * down. Gesture callbacks run as worklets on the UI thread, so updating React state has to go
 * through `runOnJS`.
 */
function Scrubber({ duration, currentTime, onSeek }: { duration: number; currentTime: number; onSeek: (time: number) => void }) {
  const [barWidth, setBarWidth] = useState(0);
  const [dragRatio, setDragRatio] = useState<number | null>(null);
  const barWidthRef = useRef(0);

  const updateFromX = (x: number) => {
    if (barWidthRef.current > 0) setDragRatio(clamp01(x / barWidthRef.current));
  };
  const commitFromX = (x: number) => {
    if (barWidthRef.current > 0 && duration > 0) onSeek(clamp01(x / barWidthRef.current) * duration);
    setDragRatio(null);
  };

  const pan = Gesture.Pan()
    .minDistance(0)
    .onBegin((e) => runOnJS(updateFromX)(e.x))
    .onUpdate((e) => runOnJS(updateFromX)(e.x))
    .onEnd((e) => runOnJS(commitFromX)(e.x));

  const ratio = dragRatio ?? (duration > 0 ? currentTime / duration : 0);

  return (
    <GestureDetector gesture={pan}>
      <View
        onLayout={(e) => {
          barWidthRef.current = e.nativeEvent.layout.width;
          setBarWidth(e.nativeEvent.layout.width);
        }}
        style={{ justifyContent: 'center', paddingVertical: 10 }}
      >
        <View style={{ height: 4, borderRadius: 2, backgroundColor: media.track, overflow: 'hidden', opacity: barWidth > 0 ? 1 : 0 }}
          accessibilityRole="adjustable" accessibilityValue={{ min: 0, max: 100, now: Math.round(ratio * 100) }}>
          <View style={{ width: `${Math.round(ratio * 100)}%`, height: 4, backgroundColor: media.gold }} />
        </View>
      </View>
    </GestureDetector>
  );
}

/**
 * Streams HLS/MP4 via expo-video (never downloads the whole file). Fires `onCompleted` once
 * when playback reaches the end (analytics: video_completed).
 *
 * Custom controls, not expo-video's `nativeControls`: the platform control bar's tap-to-show
 * gesture turned out to be unreliable in this app — it worked once per screen visit and then
 * stopped responding to taps. We ruled out the screenshot-protection feature as the cause
 * (same symptom with it fully disabled) without finding another one, and nativeControls gives
 * this app no way to debug or control its internal gesture handling at all — so play/pause,
 * scrubbing and the show/hide-on-tap toggle are plain React state we fully own instead,
 * nothing native left to intermittently stop responding.
 */
export function VideoPlayer({ uri, poster, onCompleted }: { uri: string; poster: string | null; onCompleted?: () => void }) {
  const { t } = useTranslation();
  const { spacing } = useTheme();
  const videoViewRef = useRef<VideoView>(null);
  const done = useRef(false);
  const [started, setStarted] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const player = useVideoPlayer({ uri }, (p) => {
    p.loop = false;
    p.timeUpdateEventInterval = 1;
  });
  const { isPlaying } = useEvent(player, 'playingChange', { isPlaying: player.playing });
  const { currentTime: eventTime } = useEvent(player, 'timeUpdate', { currentTime: player.currentTime, currentLiveTimestamp: null, currentOffsetFromLive: null, bufferedPosition: 0 });

  useEffect(() => {
    if (isPlaying) {
      setStarted(true);
    }
  }, [isPlaying]);

  useEffect(() => {
    setCurrentTime(eventTime);
    setDuration(player.duration || 0);
  }, [eventTime, player]);

  const clearHideTimer = () => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
  };
  const scheduleAutoHide = () => {
    clearHideTimer();
    hideTimer.current = setTimeout(() => setControlsVisible(false), AUTO_HIDE_MS);
  };

  useEffect(() => {
    if (isPlaying && controlsVisible) {
      scheduleAutoHide();
    } else {
      clearHideTimer();
    }
    return clearHideTimer;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, controlsVisible]);

  useEffect(() => {
    const sub = player.addListener('playToEnd', () => {
      if (!done.current) {
        done.current = true;
        onCompleted?.();
      }
      setControlsVisible(true);
    });
    return () => sub.remove();
  }, [player, onCompleted]);

  const toggleControls = () => setControlsVisible((v) => !v);
  const togglePlay = () => {
    if (isPlaying) {
      player.pause();
    } else {
      player.play();
    }
    setControlsVisible(true);
  };

  return (
    <View style={{ width: '100%', aspectRatio: ratios.video, backgroundColor: media.midnight }}>
      {!started ? <DAOImage uri={poster} style={{ position: 'absolute', width: '100%', height: '100%' }} /> : null}
      <VideoView ref={videoViewRef} player={player} style={{ width: '100%', height: '100%' }} contentFit="cover" nativeControls={false} allowsPictureInPicture />
      <Pressable accessibilityRole="button" accessibilityLabel={t('vlog.toggleControls')} onPress={toggleControls} style={{ position: 'absolute', width: '100%', height: '100%' }}>
        {controlsVisible ? (
          <>
            <Pressable accessibilityRole="button" accessibilityLabel={isPlaying ? t('vlog.pause') : t('vlog.play')} onPress={togglePlay}
              style={{ position: 'absolute', alignSelf: 'center', top: '45%', width: 64, height: 64, borderRadius: 32, backgroundColor: media.textMuted, alignItems: 'center', justifyContent: 'center' }}>
              <Feather name={isPlaying ? 'pause' : 'play'} size={26} color={media.glassIcon} />
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel={t('vlog.pictureInPicture')} onPress={() => void videoViewRef.current?.startPictureInPicture()}
              style={{ position: 'absolute', top: spacing.sm, right: spacing.sm, width: 36, height: 36, borderRadius: 18, backgroundColor: media.textMuted, alignItems: 'center', justifyContent: 'center' }}>
              <MaterialIcons name="picture-in-picture-alt" size={18} color={media.glassIcon} />
            </Pressable>
            <View style={{ position: 'absolute', left: spacing.md, right: spacing.md, bottom: spacing.sm, flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <DAOText variant="caption" style={{ color: media.text }}>{formatDuration(currentTime)}</DAOText>
              <View style={{ flex: 1 }}><Scrubber duration={duration} currentTime={currentTime} onSeek={(t2) => { player.currentTime = t2; }} /></View>
              <DAOText variant="caption" style={{ color: media.text }}>{formatDuration(duration)}</DAOText>
            </View>
          </>
        ) : null}
      </Pressable>
    </View>
  );
}
