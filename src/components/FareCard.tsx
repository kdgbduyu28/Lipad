import { Image } from 'expo-image';
import * as Linking from 'expo-linking';
import { useEffect, useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import airlines from '../data/airlines.json';
import { t } from '../i18n';
import { fetchPartners } from '../lib/api';
import { BookOption, Partners, airlineLogo, airlineName, bookingOptions } from '../lib/booking';
import { groupTotal, travellers } from '../lib/fares';
import { ago, day, duration, peso, time } from '../lib/format';
import type { Fare, Pax } from '../lib/types';
import { C, themed } from '../theme';
import { Sheet } from './Pickers';
import { Icon, P, Row } from './ui';

const NAMES = airlines as Record<string, string>;
export const airline = (code: string) => airlineName(code, NAMES);

const stopsText = (n: number) => (n === 0 ? t('Direct') : n === 1 ? t('1 stop') : t('{n} stops', { n }));

export function Logo({ code, size = 36 }: { code: string; size?: number }) {
  return (
    <View style={[s.logo, { width: size, height: size }]}>
      <Image source={{ uri: airlineLogo(code, 64) }} style={{ width: size - 6, height: size - 6 }} contentFit="contain" accessibilityLabel={airline(code)} />
    </View>
  );
}

export function FareCard({ fare, pax, checkedAt, badge, onPress }: { fare: Fare; pax: Pax; checkedAt: string; badge?: string; onPress: () => void }) {
  const total = groupTotal(fare.price, pax);
  const many = travellers(pax) > 1;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [s.card, pressed && { opacity: 0.9 }]} accessibilityRole="button" accessibilityLabel={`${airline(fare.airline)}, ${day(fare.departAt)}, ${peso(fare.price)}`}>
      {!!badge && (
        <View style={s.badge}>
          <Text style={s.badgeText}>{badge}</Text>
        </View>
      )}
      <Row gap={12}>
        <Logo code={fare.airline} />
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={s.airline} numberOfLines={1}>
            {airline(fare.airline)}
            {fare.flight ? ` · ${fare.flight}` : ''}
          </Text>
          <Leg date={fare.departAt} from={fare.fromAirport} to={fare.toAirport} stops={fare.stops} />
          {!!fare.returnAt && <Leg date={fare.returnAt} from={fare.toAirport} to={fare.fromAirport} stops={fare.returnStops ?? fare.stops} />}
          {!!fare.minutes && <Text style={s.meta}>{t('{d} total flying', { d: duration(fare.minutes) })}</Text>}
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={s.from}>{t('from')}</Text>
          <Text style={s.price}>{peso(fare.price)}</Text>
          <Text style={s.meta}>{fare.returnAt ? t('round trip') : t('one-way')}</Text>
          {many && <Text style={s.meta}>{t('≈ {total} for {n}', { total: peso(total), n: travellers(pax) })}</Text>}
        </View>
      </Row>
      <Text style={s.checked}>{t('Seen {ago} · final price on the booking site', { ago: ago(checkedAt) })}</Text>
    </Pressable>
  );
}

function Leg({ date, from, to, stops }: { date: string; from: string; to: string; stops: number }) {
  return (
    <Text style={s.leg}>
      {day(date)}
      {time(date) ? ` ${time(date)}` : ''} · {from} → {to} ·{' '}
      <Text style={{ color: stops ? C.warn : C.good, fontWeight: '600' }}>{stopsText(stops)}</Text>
    </Text>
  );
}

function open(url: string) {
  if (Platform.OS === 'web') window.open(url, '_blank', 'noopener');
  else Linking.openURL(url);
}

/** The "Book" sheet: real sites to buy on, airline first. */
export function BookSheet({ fare, pax, onClose }: { fare: Fare | null; pax: Pax; onClose: () => void }) {
  const [partners, setPartners] = useState<Partners>({});
  useEffect(() => {
    fetchPartners().then(setPartners);
  }, []);
  const options: BookOption[] = fare ? bookingOptions(fare, pax, partners) : [];
  return (
    <Sheet open={!!fare} title={t('Where to book')} onClose={onClose}>
      {fare && (
        <>
          <P muted small>
            {t('Lipad found this fare from {price}. Prices change fast, so each site shows its own final price.', { price: peso(fare.price) })}
          </P>
          {options.map((o) => (
            <Pressable key={o.name} onPress={() => open(o.url)} style={({ pressed }) => [s.option, pressed && { backgroundColor: C.surface }]} accessibilityRole="link" accessibilityLabel={`${t('Book on')} ${o.name}`}>
              {o.kind === 'airline' ? <Logo code={fare.airline} size={40} /> : <View style={[s.logo, { width: 40, height: 40 }]}><Icon name={o.kind === 'ota' ? 'globe-outline' : 'search'} color={C.primary} /></View>}
              <View style={{ flex: 1 }}>
                <Text style={s.airline}>{o.name}</Text>
                <Text style={s.meta}>{t(o.note)}</Text>
                {o.kind === 'airline' && <Text style={s.meta}>{t('Opens the airline site; enter your dates there.')}</Text>}
              </View>
              <Text style={s.check}>{t('Check price')}</Text>
              <Icon name="open-outline" size={18} color={C.primary} />
            </Pressable>
          ))}
          <P muted small>
            {t('Lipad may earn a small commission from some sites, at no cost to you. Lipad never takes payment.')}
          </P>
        </>
      )}
    </Sheet>
  );
}

const s = themed(() => ({
  card: { backgroundColor: C.card, borderRadius: 14, padding: 14, gap: 10, borderWidth: 1, borderColor: C.line },
  logo: { borderRadius: 10, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.line },
  airline: { color: C.text, fontSize: 15, fontWeight: '700' },
  leg: { color: C.text, fontSize: 13 },
  meta: { color: C.muted, fontSize: 12 },
  from: { color: C.muted, fontSize: 11 },
  price: { color: C.primary, fontSize: 20, fontWeight: '800' },
  checked: { color: C.faint, fontSize: 11 },
  badge: { position: 'absolute', top: -9, left: 12, backgroundColor: C.accent, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { color: C.onColor, fontSize: 11, fontWeight: '700' },
  option: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, borderRadius: 12, borderWidth: 1, borderColor: C.line },
  check: { color: C.primary, fontWeight: '700', fontSize: 13 },
}));
