import type { PropsWithChildren } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '@/shared/theme';
import { DAOButton } from './DAOButton';
import { DAOText } from './DAOText';

interface Props {
  visible: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
  destructive?: boolean;
  loading?: boolean;
}

/** Centered dialog (confirmations, celebrations). */
export function DAOModal({ visible, onClose, title, message, confirmLabel, cancelLabel, onConfirm, destructive, loading, children }: PropsWithChildren<Props>) {
  const { colors, radius, spacing, shadows } = useTheme();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={[StyleSheet.absoluteFill, { backgroundColor: colors.overlay }]} onPress={onClose} />
      <View style={styles.center} pointerEvents="box-none">
        <View style={[{ backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.xxl, width: '86%', maxWidth: 380, gap: spacing.md }, shadows.floating]} accessibilityViewIsModal>
          {title ? <DAOText variant="heading" align="center">{title}</DAOText> : null}
          {message ? <DAOText variant="body" tone="textMuted" align="center">{message}</DAOText> : null}
          {children}
          {onConfirm ? (
            <View style={{ gap: spacing.sm, marginTop: spacing.sm }}>
              <DAOButton label={confirmLabel ?? 'OK'} variant={destructive ? 'danger' : 'primary'} onPress={onConfirm} loading={loading} fullWidth />
              {cancelLabel ? <DAOButton label={cancelLabel} variant="ghost" onPress={onClose} fullWidth /> : null}
            </View>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({ center: { flex: 1, alignItems: 'center', justifyContent: 'center' } });
