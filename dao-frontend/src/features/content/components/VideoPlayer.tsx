import { Feather } from '@expo/vector-icons';
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
 * Supports both a plain tap (seek to where you tapped) and a drag, via the standard RN
 * PanResponder seek-bar pattern: capture the touch-down position once at grant (a single
 * reliable `locationX` read — during `move`, `locationX` can be relative to whatever subview
 * is currently under the finger rather than this bar, which is a known RN inconsistency), then
 * track movement from there using `gestureState.dx` (a cumulative screen-space delta, reliable
 * throughout the gesture) instead of re-reading `locationX` on every move.
 */
function Scrubber({ duration, currentTime, onSeek }: { duration: number; currentTime: number; onSeek: (time: number) => void }) {
  const [barWidth, setBarWidth] = useState(0);
  const [dragRatio, setDragRatio] = useState<number | null>(null);
  const touchStartX = useRef(0);
  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => {
        touchStartX.current = e.nativeEvent.locationX;
        if (barWidth > 0) setDragRatio(clamp01(e.nativeEvent.locationX / barWidth));
      },
      onPanResponderMove: (_, g) => {
        if (barWidth <= 0) return;
        setDragRatio(clamp01((touchStartX.current + g.dx) / barWidth));
      },
      onPanResponderRelease: (_, g) => {
        if (barWidth > 0 && duration > 0) {
          onSeek(clamp01((touchStartX.current + g.dx) / barWidth) * duration);
        }
        setDragRatio(null);
      },
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
 * stopped responding to taps, a pattern that pointed at something disrupting its gesture
 * recognizer rather than random native flakiness. We tested and ruled out the screenshot-
 * protection feature (same symptom with it fully disabled) without finding another cause, and
 * rather than keep guessing at what's fighting the native control bar, this sidesteps the
 * whole class of bug: play/pause, scrubbing and the control-visibility toggle are all plain
 * JS/React state we fully own, the same approach most video apps (Telegram included) use.
 */
export function VideoPlayer({ uri, poster, onCompleted }: { uri: string; poster: string | null; onCompleted?: () => void }) {
  const { t } = useTranslation();
  const { spacing } = useTheme();
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
      <VideoView player={player} style={{ width: '100%', height: '100%' }} contentFit="cover" nativeControls={false} />
      <Pressable accessibilityRole="button" accessibilityLabel={t('vlog.toggleControls')} onPress={toggleControls} style={{ position: 'absolute', width: '100%', height: '100%' }}>
        {controlsVisible ? (
          <>
            <Pressable accessibilityRole="button" accessibilityLabel={isPlaying ? t('vlog.pause') : t('vlog.play')} onPress={togglePlay}
              style={{ position: 'absolute', alignSelf: 'center', top: '45%', width: 64, height: 64, borderRadius: 32, backgroundColor: media.textMuted, alignItems: 'center', justifyContent: 'center' }}>
              <Feather name={isPlaying ? 'pause' : 'play'} size={26} color={media.glassIcon} />
            </Pressable>
            <View style={{ position: 'absolute', left: spacing.md, right: spacing.md, bottom: spacing.sm, flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <DAOText variant="caption" style={{ color: media.text }}>{formatDuration(currentTime)}</DAOText>
              <View style={{ flex: 1 }}><Scrubber duration={duration} currentTime={currentTime} onSeek={(t) => { player.currentTime = t; }} /></View>
              <DAOText variant="caption" style={{ color: media.text }}>{formatDuration(duration)}</DAOText>
            </View>
          </>
        ) : null}
      </Pressable>
    </View>
  );
}
