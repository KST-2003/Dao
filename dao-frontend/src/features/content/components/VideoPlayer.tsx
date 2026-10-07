import { Feather, MaterialIcons } from '@expo/vector-icons';
import { useEvent } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useTranslation } from 'react-i18next';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { DAOImage, DAOText } from '@/shared/components';
import { formatDuration } from '@/shared/utils/format';
import { ratios, useTheme, media } from '@/shared/theme';

const AUTO_HIDE_MS = 3000;
const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

/**
 * Drag-and-tap scrubber, on react-native-gesture-handler's Gesture API rather than core
 * React Native's PanResponder (nesting a PanResponder inside the Pressable-based
 * toggle-controls layer this sits under made the drag never activate at all — RNGH is built
 * to arbitrate against other gestures in the same tree, including Pressable, which is
 * RNGH-backed under the hood here since GestureHandlerRootView wraps the whole app).
 *
 * The fill bar is driven by a Reanimated shared value + Animated.View, updated directly in
 * the worklet — not React state. Routing every touch-move through `runOnJS` to trigger a React
 * re-render was the actual cause of the previous "not smooth" dragging: that's a UI-thread →
 * JS-thread round trip (plus a full component re-render) on every single frame of movement.
 * Reading/writing a shared value from the worklet never leaves the UI thread, so the bar can
 * track the finger at the native frame rate. `runOnJS` is reserved for the two things that
 * actually need the JS thread: the (lightly throttled) live time-label text, and the final
 * seek commit on release.
 */
function Scrubber({
  duration, currentTime, onSeek, onDragTimeChange,
}: { duration: number; currentTime: number; onSeek: (time: number) => void; onDragTimeChange: (time: number | null) => void }) {
  const barWidth = useSharedValue(0);
  const ratio = useSharedValue(duration > 0 ? currentTime / duration : 0);
  const dragging = useSharedValue(false);
  const lastReported = useSharedValue(-1);

  useEffect(() => {
    if (!dragging.value) {
      ratio.value = duration > 0 ? currentTime / duration : 0;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTime, duration]);

  const pan = Gesture.Pan()
    .minDistance(0)
    .onBegin((e) => {
      dragging.value = true;
      if (barWidth.value > 0) ratio.value = clamp01(e.x / barWidth.value);
    })
    .onUpdate((e) => {
      if (barWidth.value <= 0) return;
      const r = clamp01(e.x / barWidth.value);
      ratio.value = r;
      if (Math.abs(r - lastReported.value) > 0.004) {
        lastReported.value = r;
        runOnJS(onDragTimeChange)(r * duration);
      }
    })
    .onEnd((e) => {
      dragging.value = false;
      if (barWidth.value > 0 && duration > 0) {
        runOnJS(onSeek)(clamp01(e.x / barWidth.value) * duration);
      }
    });

  const fillStyle = useAnimatedStyle(() => ({ width: `${ratio.value * 100}%` }));

  return (
    <GestureDetector gesture={pan}>
      <View onLayout={(e) => { barWidth.value = e.nativeEvent.layout.width; }} style={{ justifyContent: 'center', paddingVertical: 10 }}>
        <View style={{ height: 4, borderRadius: 2, backgroundColor: media.track, overflow: 'hidden' }} accessibilityRole="adjustable">
          <Animated.View style={[{ height: 4, backgroundColor: media.gold }, fillStyle]} />
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
  const [previewTime, setPreviewTime] = useState<number | null>(null);
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
  const seek = (time: number) => {
    player.currentTime = time;
    setPreviewTime(null);
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
              <DAOText variant="caption" style={{ color: media.text }}>{formatDuration(previewTime ?? currentTime)}</DAOText>
              <View style={{ flex: 1 }}><Scrubber duration={duration} currentTime={currentTime} onSeek={seek} onDragTimeChange={setPreviewTime} /></View>
              <DAOText variant="caption" style={{ color: media.text }}>{formatDuration(duration)}</DAOText>
            </View>
          </>
        ) : null}
      </Pressable>
    </View>
  );
}
