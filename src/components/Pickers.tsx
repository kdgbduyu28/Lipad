import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { t } from '../i18n';
import { day, monthLabel, nextMonths, todayPH } from '../lib/format';
import { PH_HOMES, Place, cityName, countryName, place, searchPlaces } from '../lib/places';
import { C, themed } from '../theme';
import { Chip, Icon, Wrap } from './ui';

/** Full-screen sheet with a title and close button. */
export function Sheet({ open, title, onClose, children }: { open: boolean; title: string; onClose: () => void; children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={open} animationType="slide" transparent onRequestClose={onClose}>
      <View style={s.backdrop}>
        <Pressable style={{ flex: 1 }} onPress={onClose} accessibilityLabel={t('Close')} />
        <View style={[s.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={s.sheetHead}>
            <Text style={s.sheetTitle}>{title}</Text>
            <Pressable onPress={onClose} hitSlop={10} accessibilityRole="button" accessibilityLabel={t('Close')}>
              <Icon name="close" size={24} color={C.muted} />
            </Pressable>
          </View>
          {children}
        </View>
      </View>
    </Modal>
  );
}

/** Field that opens a place search. */
export function PlaceField({ label, value, onChange, exclude }: { label: string; value: string; onChange: (code: string) => void; exclude?: string }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const results = useMemo(() => (q ? searchPlaces(q, 12) : PH_HOMES.map((c) => place(c)).filter((p): p is Place => !!p)), [q]);
  const pick = (code: string) => {
    onChange(code);
    setOpen(false);
    setQ('');
  };
  return (
    <>
      <Pressable onPress={() => setOpen(true)} style={s.field} accessibilityRole="button" accessibilityLabel={`${label}: ${value ? cityName(value) : t('choose')}`}>
        <Text style={s.fieldLabel}>{label}</Text>
        <Text style={[s.fieldValue, !value && { color: C.faint }]} numberOfLines={1}>
          {value ? `${cityName(value)} · ${value}` : t('City or airport')}
        </Text>
      </Pressable>
      <Sheet open={open} title={label} onClose={() => setOpen(false)}>
        <View style={s.search}>
          <Icon name="search" size={18} color={C.muted} />
          <TextInput
            value={q}
            onChangeText={setQ}
            autoFocus
            placeholder={t('Type a city, airport or code')}
            placeholderTextColor={C.faint}
            style={s.input}
            autoCorrect={false}
            autoCapitalize="none"
          />
        </View>
        {!q && <Text style={s.hint}>{t('Popular in the Philippines')}</Text>}
        <ScrollView style={{ maxHeight: 420 }} keyboardShouldPersistTaps="handled">
          {results
            .filter((p) => p.code !== exclude)
            .map((p) => (
              <Pressable key={p.code} onPress={() => pick(p.code)} style={({ pressed }) => [s.option, pressed && { backgroundColor: C.surface }]} accessibilityRole="button">
                <Icon name={p.kind === 'city' ? 'business-outline' : 'airplane-outline'} color={C.muted} size={18} />
                <View style={{ flex: 1 }}>
                  <Text style={s.optTitle}>{p.kind === 'city' ? p.name : `${p.name}, ${cityName(p.cityCode)}`}</Text>
                  <Text style={s.optSub}>
                    {countryName(p.country)}
                    {p.kind === 'city' ? ` · ${t('all airports')}` : ''}
                  </Text>
                </View>
                <Text style={s.code}>{p.code}</Text>
              </Pressable>
            ))}
          {!!q && !results.length && <Text style={s.hint}>{t('No match. Try the city name or a 3-letter code.')}</Text>}
        </ScrollView>
      </Sheet>
    </>
  );
}

const WEEK = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function grid(month: string): (string | null)[] {
  const [y, m] = month.split('-').map(Number);
  const first = new Date(Date.UTC(y, m - 1, 1)).getUTCDay();
  const n = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return [...Array(first).fill(null), ...Array.from({ length: n }, (_, i) => `${month}-${String(i + 1).padStart(2, '0')}`)];
}

/**
 * Date or month picker. Value is YYYY-MM-DD, YYYY-MM ("any day"), or ''.
 * `allowMonth` adds "Any day this month"; `min` blocks earlier days.
 */
export function DateField({
  label,
  value,
  onChange,
  allowMonth = true,
  min,
  clearable,
  prices,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  allowMonth?: boolean;
  min?: string;
  clearable?: boolean;
  prices?: Record<string, number>;
}) {
  const today = todayPH();
  const floor = min && min > today ? min : today;
  const months = nextMonths(12);
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState((value || floor).slice(0, 7));
  const shown = value ? (value.length === 7 ? t('Any day in {month}', { month: monthLabel(value) }) : day(value)) : clearable ? t('One-way') : t('Pick a date');
  const idx = Math.max(0, months.indexOf(month));
  return (
    <>
      <Pressable onPress={() => setOpen(true)} style={s.field} accessibilityRole="button" accessibilityLabel={`${label}: ${shown}`}>
        <Text style={s.fieldLabel}>{label}</Text>
        <Text style={[s.fieldValue, !value && { color: C.faint }]} numberOfLines={1}>
          {shown}
        </Text>
      </Pressable>
      <Sheet open={open} title={label} onClose={() => setOpen(false)}>
        <View style={s.monthNav}>
          <Pressable onPress={() => setMonth(months[Math.max(0, idx - 1)])} disabled={idx === 0} hitSlop={10} accessibilityLabel={t('Previous month')}>
            <Icon name="chevron-back" color={idx === 0 ? C.line : C.primary} />
          </Pressable>
          <Text style={s.sheetTitle}>{monthLabel(month)}</Text>
          <Pressable onPress={() => setMonth(months[Math.min(months.length - 1, idx + 1)])} disabled={idx === months.length - 1} hitSlop={10} accessibilityLabel={t('Next month')}>
            <Icon name="chevron-forward" color={idx === months.length - 1 ? C.line : C.primary} />
          </Pressable>
        </View>
        <View style={s.week}>
          {WEEK.map((w, i) => (
            <Text key={i} style={s.weekDay}>
              {w}
            </Text>
          ))}
        </View>
        <View style={s.days}>
          {grid(month).map((d, i) => {
            if (!d) return <View key={i} style={s.cell} />;
            const off = d < floor;
            const on = d === value;
            const price = prices?.[d];
            return (
              <Pressable
                key={d}
                disabled={off}
                onPress={() => {
                  onChange(d);
                  setOpen(false);
                }}
                style={[s.cell, on && { backgroundColor: C.primary, borderRadius: 10 }]}
                accessibilityRole="button"
                accessibilityLabel={day(d)}
              >
                <Text style={[s.dayNum, off && { color: C.line }, on && { color: C.onPrimary }]}>{Number(d.slice(8))}</Text>
                {price != null && <Text style={[s.dayPrice, on && { color: C.onPrimary }]}>{Math.round(price / 100) / 10}k</Text>}
              </Pressable>
            );
          })}
        </View>
        <Wrap>
          {allowMonth && (
            <Chip
              label={t('Any day in {month}', { month: monthLabel(month) })}
              on={value === month}
              icon="calendar-outline"
              onPress={() => {
                onChange(month);
                setOpen(false);
              }}
            />
          )}
          {clearable && (
            <Chip
              label={t('No return (one-way)')}
              on={!value}
              onPress={() => {
                onChange('');
                setOpen(false);
              }}
            />
          )}
        </Wrap>
      </Sheet>
    </>
  );
}

const s = themed(() => ({
  backdrop: { flex: 1, backgroundColor: C.overlay, justifyContent: 'flex-end' },
  sheet: { backgroundColor: C.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16, gap: 12, width: '100%', maxWidth: 560, alignSelf: 'center', maxHeight: '92%' },
  sheetHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sheetTitle: { color: C.text, fontSize: 17, fontWeight: '700' },
  field: { flex: 1, backgroundColor: C.surface, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, minHeight: 58, justifyContent: 'center' },
  fieldLabel: { color: C.muted, fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4 },
  fieldValue: { color: C.text, fontSize: 16, fontWeight: '600', marginTop: 2 },
  search: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.surface, borderRadius: 12, paddingHorizontal: 12 },
  input: { flex: 1, color: C.text, fontSize: 16, paddingVertical: 12, outlineStyle: 'none' } as object,
  hint: { color: C.muted, fontSize: 13, paddingVertical: 4 },
  option: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 6, borderRadius: 10 },
  optTitle: { color: C.text, fontSize: 15, fontWeight: '600' },
  optSub: { color: C.muted, fontSize: 13 },
  code: { color: C.primary, fontWeight: '700', fontSize: 14 },
  monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4 },
  week: { flexDirection: 'row' },
  weekDay: { flex: 1, textAlign: 'center', color: C.muted, fontSize: 12, fontWeight: '600' },
  days: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: "14.2857%" as const, aspectRatio: 1.1, alignItems: 'center', justifyContent: 'center' },
  dayNum: { color: C.text, fontSize: 15, fontWeight: '600' },
  dayPrice: { color: C.good, fontSize: 10, fontWeight: '600' },
}));
