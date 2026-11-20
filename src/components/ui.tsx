import Ionicons from '@expo/vector-icons/Ionicons';
import { ReactNode } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { t } from '../i18n';
import { C, MAX_WIDTH, RADIUS, themed } from '../theme';

export type IconName = keyof typeof Ionicons.glyphMap;

export function Icon({ name, size = 20, color = C.text, style }: { name: IconName; size?: number; color?: string; style?: StyleProp<TextStyle> }) {
  return <Ionicons name={name} size={size} color={color} style={style} />;
}

/** Scrolling page with a centered max-width column and safe-area padding. */
export function Page({ children, header, scroll = true, pad = true }: { children: ReactNode; header?: ReactNode; scroll?: boolean; pad?: boolean }) {
  const insets = useSafeAreaInsets();
  // pad=false is full-bleed: the screen lays out its own columns (e.g. a full-width hero).
  const inner = pad ? <View style={[styles.column, styles.pad]}>{children}</View> : <View>{children}</View>;
  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      {header}
      {scroll ? (
        <ScrollView contentContainerStyle={{ paddingBottom: 32 + insets.bottom }} keyboardShouldPersistTaps="handled">
          {inner}
        </ScrollView>
      ) : (
        inner
      )}
    </View>
  );
}

/** Top bar for pushed screens: back button, title, optional right side. */
export function Bar({ title, subtitle, onBack, right }: { title: string; subtitle?: string; onBack?: () => void; right?: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { paddingTop: insets.top + 8 }]}>
      <View style={[styles.column, styles.barRow]}>
        {onBack && (
          <Pressable onPress={onBack} hitSlop={10} accessibilityRole="button" accessibilityLabel={t('Back')} style={styles.barBtn}>
            <Icon name="arrow-back" color={C.onColor} size={22} />
          </Pressable>
        )}
        <View style={{ flex: 1 }}>
          <Text style={styles.barTitle} numberOfLines={1}>
            {title}
          </Text>
          {!!subtitle && (
            <Text style={styles.barSub} numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>
        {right}
      </View>
    </View>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function H({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  return <Text style={[styles.h, style]} accessibilityRole="header">{children}</Text>;
}

export function P({ children, muted, style, small }: { children: ReactNode; muted?: boolean; small?: boolean; style?: StyleProp<TextStyle> }) {
  return <Text style={[styles.p, muted && { color: C.muted }, small && { fontSize: 13 }, style]}>{children}</Text>;
}

export function Button({
  label,
  onPress,
  kind = 'primary',
  icon,
  disabled,
  loading,
  style,
}: {
  label: string;
  onPress: () => void;
  kind?: 'primary' | 'ghost' | 'soft' | 'accent';
  icon?: IconName;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const bg = kind === 'primary' ? C.primary : kind === 'accent' ? C.accent : kind === 'soft' ? C.primarySoft : 'transparent';
  const fg = kind === 'primary' ? C.onPrimary : kind === 'accent' ? C.onColor : C.primary;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      style={({ pressed }) => [styles.btn, { backgroundColor: bg, opacity: disabled ? 0.45 : pressed ? 0.85 : 1 }, kind === 'ghost' && { borderWidth: 1, borderColor: C.line }, style]}
    >
      {loading ? <ActivityIndicator color={fg} /> : icon && <Icon name={icon} color={fg} size={18} />}
      <Text style={[styles.btnText, { color: fg }]}>{label}</Text>
    </Pressable>
  );
}

export function Chip({ label, on, onPress, icon }: { label: string; on?: boolean; onPress: () => void; icon?: IconName }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: !!on }}
      style={[styles.chip, on ? { backgroundColor: C.primary, borderColor: C.primary } : { backgroundColor: C.card, borderColor: C.line }]}
    >
      {icon && <Icon name={icon} size={15} color={on ? C.onPrimary : C.muted} />}
      <Text style={[styles.chipText, { color: on ? C.onPrimary : C.text }]}>{label}</Text>
    </Pressable>
  );
}

export function Row({ children, style, gap = 8 }: { children: ReactNode; style?: StyleProp<ViewStyle>; gap?: number }) {
  return <View style={[{ flexDirection: 'row', alignItems: 'center', gap }, style]}>{children}</View>;
}

export function Wrap({ children, gap = 8 }: { children: ReactNode; gap?: number }) {
  return <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap }}>{children}</View>;
}

export function Stepper({ label, hint, value, min = 0, max = 9, onChange }: { label: string; hint?: string; value: number; min?: number; max?: number; onChange: (n: number) => void }) {
  return (
    <Row style={styles.stepper}>
      <View style={{ flex: 1 }}>
        <Text style={styles.p}>{label}</Text>
        {!!hint && <Text style={[styles.p, { color: C.muted, fontSize: 13 }]}>{hint}</Text>}
      </View>
      <Pressable onPress={() => onChange(Math.max(min, value - 1))} disabled={value <= min} style={[styles.stepBtn, value <= min && { opacity: 0.35 }]} accessibilityLabel={t('Fewer {what}', { what: label })}>
        <Icon name="remove" color={C.primary} />
      </Pressable>
      <Text style={styles.stepVal} accessibilityLiveRegion="polite">
        {value}
      </Text>
      <Pressable onPress={() => onChange(Math.min(max, value + 1))} disabled={value >= max} style={[styles.stepBtn, value >= max && { opacity: 0.35 }]} accessibilityLabel={t('More {what}', { what: label })}>
        <Icon name="add" color={C.primary} />
      </Pressable>
    </Row>
  );
}

/** "Sample prices" warning shown whenever fares are made up. */
export function SampleBadge({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <View style={styles.sample}>
      <Icon name="flask-outline" size={16} color={C.warn} />
      <Text style={[styles.p, { color: C.warn, flex: 1, fontSize: 13 }]}>{t('Sample prices: live fares turn on once the price service is connected.')}</Text>
    </View>
  );
}

export function Empty({ icon, title, body, action }: { icon: IconName; title: string; body?: string; action?: ReactNode }) {
  return (
    <View style={styles.empty}>
      <Icon name={icon} size={40} color={C.faint} />
      <Text style={[styles.h, { textAlign: 'center' }]}>{title}</Text>
      {!!body && <P muted style={{ textAlign: 'center' }}>{body}</P>}
      {action}
    </View>
  );
}

export function Loading({ label }: { label?: string }) {
  return (
    <View style={styles.empty}>
      <ActivityIndicator color={C.primary} size="large" />
      {!!label && <P muted>{label}</P>}
    </View>
  );
}

export const styles = themed(() => ({
  column: { width: '100%', maxWidth: MAX_WIDTH, alignSelf: 'center' },
  pad: { paddingHorizontal: 16, paddingTop: 16, gap: 16 },
  bar: { backgroundColor: C.brand, paddingBottom: 12 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16 },
  barBtn: { padding: 4 },
  barTitle: { color: C.onColor, fontSize: 18, fontWeight: '700' },
  barSub: { color: C.onColor, opacity: 0.85, fontSize: 13, marginTop: 1 },
  card: { backgroundColor: C.card, borderRadius: RADIUS, padding: 16, gap: 12, borderWidth: StyleSheet.hairlineWidth, borderColor: C.line },
  h: { color: C.text, fontSize: 17, fontWeight: '700' },
  p: { color: C.text, fontSize: 15, lineHeight: 21 },
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 12, paddingVertical: 13, paddingHorizontal: 18, minHeight: 48 },
  btnText: { fontSize: 16, fontWeight: '700' },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, borderWidth: 1, paddingVertical: 8, paddingHorizontal: 14, minHeight: 38 },
  chipText: { fontSize: 14, fontWeight: '600' },
  stepper: { paddingVertical: 6 },
  stepBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.primarySoft, alignItems: 'center', justifyContent: 'center' },
  stepVal: { color: C.text, fontSize: 17, fontWeight: '700', minWidth: 28, textAlign: 'center' },
  sample: { flexDirection: 'row', gap: 8, alignItems: 'center', backgroundColor: C.warnSoft, borderRadius: 12, padding: 12 },
  empty: { alignItems: 'center', gap: 10, paddingVertical: 40, paddingHorizontal: 24 },
}));
