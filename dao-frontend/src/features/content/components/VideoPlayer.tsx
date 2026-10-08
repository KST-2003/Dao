import { Feather, MaterialIcons } from '@expo/vector-icons';
import { useEvent } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect, useRef, useState } from 'react';
import { PanResponder, Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { DAOImage, DAOText } from '@/shared/components';
import { formatDuration } from '@/shared/utils/format';
import { ratios, useTheme, media } from '@/shared/theme';

const AUTO_HIDE_MS = 3000;
const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

/**
 * Drag-and-tap scrubber on core React Native's PanResponder — not react-native-gesture-
 * handler's Gesture API. That was tried first (it fixes the "nested inside a Pressable"
 * conflict PanResponder has, and its worklet-driven shared value made the fill bar track the
 * finger without React re-renders), but it caused the app to hard-crash on every drag with no
 * JS error screen — a native-level failure in the gesture-handler/Reanimated worklets runtime
 * that happened even on a fresh native build, so it wasn't a stale-binary issue. Without a
 * device crash log to diagnose that further, this avoids the worklet codepath entirely.
 *
 * The real fix for the original bug (drag not registering at all) was never actually about
 * PanResponder vs Gesture.Pan — it was that the scrubber was nested *inside* the Pressable
 * used for tap-to-toggle-controls, and a Pressable ancestor racing a PanResponder descendant
 * for the same touch is a known RN conflict. This scrubber is now a sibling of that Pressable
 * (see VideoPlayer's render), not a descendant of it, which is the part that actually matters.
 *
 * Using gestureState.dx (cumulative delta from the touch-down point, reliable throughout a
 * drag) added to a one-time `locationX` read at touch-down, rather than re-reading `locationX`
 * on every move — `locationX` during a PanResponder move can be relative to whatever subview
 * is currently under the finger rather than this bar, which is a known RN inconsistency.
 */
function Scrubber({ duration, currentTime, onSeek, onDragTimeChange }: {
  duration: number; currentTime: number; onSeek: (time: number) => void; onDragTimeChange: (time: number | null) => void;
}) {
  const [barWidth, setBarWidth] = useState(0);
  const [dragRatio, setDragRatio] = useState<number | null>(null);
  const touchStartX = useRef(0);
  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => {
        touchStartX.current = e.nativeEvent.locationX;
        if (barWidth > 0) {
          const r = clamp01(e.nativeEvent.locationX / barWidth);
          setDragRatio(r);
          onDragTimeChange(r * duration);
        }
      },
      onPanResponderMove: (_, g) => {
        if (barWidth <= 0) return;
        const r = clamp01((touchStartX.current + g.dx) / barWidth);
        setDragRatio(r);
        onDragTimeChange(r * duration);
      },
      onPanResponderRelease: (_, g) => {
        if (barWidth > 0 && duration > 0) {
          onSeek(clamp01((touchStartX.current + g.dx) / barWidth) * duration);
        }
        setDragRatio(null);
      },
      onPanResponderTerminate: () => setDragRatio(null),
    }),
  ).current;
  const ratio = dragRatio ?? (duration > 0 ? currentTime / duration : 0);

  return (
    <View
      {...responder.panHandlers}
      onLayout={(e) => setBarWidth(e.nativeEvent.layout.width)}
      style={{ justifyContent: 'center', paddingVertical: 10 }}
    >
      <View style={{ height: 4, borderRadius: 2, backgroundColor: media.track, overflow: 'hidden' }}
        accessibilityRole="adjustable" accessibilityValue={{ min: 0, max: 100, now: Math.round(ratio * 100) }}>
        <View style={{ width: `${Math.round(ratio * 100)}%`, height: 4, backgroundColor: media.gold }} />
      </View>
    </View>
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
      {/* Tap-to-toggle layer + play/pause + PiP. The scrubber below is a sibling, not nested in here — see Scrubber's comment. */}
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
          </>
        ) : null}
      </Pressable>
      {controlsVisible ? (
        <View style={{ position: 'absolute', left: spacing.md, right: spacing.md, bottom: spacing.sm, flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <DAOText variant="caption" style={{ color: media.text }}>{formatDuration(previewTime ?? currentTime)}</DAOText>
          <View style={{ flex: 1 }}><Scrubber duration={duration} currentTime={currentTime} onSeek={seek} onDragTimeChange={setPreviewTime} /></View>
          <DAOText variant="caption" style={{ color: media.text }}>{formatDuration(duration)}</DAOText>
        </View>
      ) : null}
    </View>
  );
}
