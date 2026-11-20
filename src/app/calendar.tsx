import { router, useLocalSearchParams } from 'expo-router';
import Head from 'expo-router/head';
import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Bar, Card, Icon, Loading, P, Page, Row, SampleBadge } from '../components/ui';
import { t } from '../i18n';
import { fetchCalendar } from '../lib/api';
import { monthLabel, nextMonths, peso, todayPH } from '../lib/format';
import { resultsHref } from '../lib/nav';
import { cityName } from '../lib/places';
import type { CalendarResponse } from '../lib/types';
import { C, themed } from '../theme';

const WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function PriceCalendar() {
  const p = useLocalSearchParams<{ from: string; to: string; month?: string; a?: string }>();
  const from = (p.from ?? '').toUpperCase();
  const to = (p.to ?? '').toUpperCase();
  const months = nextMonths(12);
  const [month, setMonth] = useState(p.month && months.includes(p.month) ? p.month : months[0]);
  const [data, setData] = useState<CalendarResponse | null>(null);
  const idx = months.indexOf(month);
  const today = todayPH();

  useEffect(() => {
    if (!from || !to) return;
    let live = true;
    setData(null);
    fetchCalendar(from, to, month).then((d) => live && setData(d));
    return () => {
      live = false;
    };
  }, [from, to, month]);

  const prices = new Map((data?.days ?? []).map((d) => [d.date, d.price]));
  const values = [...prices.values()];
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const tone = (v: number) => {
    if (!values.length || hi === lo) return C.goodSoft;
    const r = (v - lo) / (hi - lo);
    return r < 0.34 ? C.goodSoft : r < 0.67 ? C.warnSoft : C.accentSoft;
  };

  const [y, m] = month.split('-').map(Number);
  const first = new Date(Date.UTC(y, m - 1, 1)).getUTCDay();
  const n = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const cells = [...Array(first).fill(null), ...Array.from({ length: n }, (_, i) => `${month}-${String(i + 1).padStart(2, '0')}`)];
  const title = `${cityName(from)} → ${cityName(to)}`;

  return (
    <Page
      header={
        <>
          <Head>
            <title>{`${t('Price calendar')}: ${title} · Lipad`}</title>
          </Head>
          <Bar title={t('Price calendar')} subtitle={title} onBack={() => (router.canGoBack() ? router.back() : router.replace('/'))} />
        </>
      }
    >
      <Row style={{ justifyContent: 'space-between' }}>
        <Pressable onPress={() => setMonth(months[idx - 1])} disabled={idx <= 0} hitSlop={10} accessibilityLabel={t('Previous month')}>
          <Icon name="chevron-back" color={idx <= 0 ? C.line : C.primary} />
        </Pressable>
        <Text style={s.month}>{monthLabel(month)}</Text>
        <Pressable onPress={() => setMonth(months[idx + 1])} disabled={idx >= months.length - 1} hitSlop={10} accessibilityLabel={t('Next month')}>
          <Icon name="chevron-forward" color={idx >= months.length - 1 ? C.line : C.primary} />
        </Pressable>
      </Row>
      {data && <SampleBadge show={data.sample} />}
      <Card style={{ padding: 8 }}>
        <View style={s.row}>
          {WEEK.map((w) => (
            <Text key={w} style={s.week}>
              {t(w)}
            </Text>
          ))}
        </View>
        {!data ? (
          <Loading />
        ) : (
          <View style={s.row}>
            {cells.map((d, i) => {
              if (!d) return <View key={i} style={s.cell} />;
              const v = prices.get(d);
              const past = d < today;
              return (
                <Pressable
                  key={d}
                  disabled={past}
                  onPress={() => router.push(resultsHref({ from, to, depart: d, pax: { adults: Number(p.a) || 1, kids: 0, infants: 0 } }))}
                  style={[s.cell, v != null && !past && { backgroundColor: tone(v) }, v === lo && { borderWidth: 2, borderColor: C.good }]}
                  accessibilityRole="button"
                  accessibilityLabel={`${d}${v ? `, ${peso(v)}` : ''}`}
                >
                  <Text style={[s.num, past && { color: C.line }]}>{Number(d.slice(8))}</Text>
                  {v != null && !past && <Text style={s.price}>{v >= 10000 ? `${(v / 1000).toFixed(0)}k` : `${(v / 1000).toFixed(1)}k`}</Text>}
                </Pressable>
              );
            })}
          </View>
        )}
      </Card>
      {data && values.length > 0 && (
        <P muted small>
          {t('Cheapest day: {price}. Green is cheaper, orange is pricier. One-way, one adult. Tap a day to see fares.', { price: peso(lo) })}
        </P>
      )}
      {data && !values.length && <P muted>{t('No recent prices for this month. Try the next one.')}</P>}
    </Page>
  );
}

const s = themed(() => ({
  month: { color: C.text, fontSize: 17, fontWeight: '700' },
  row: { flexDirection: 'row', flexWrap: 'wrap' },
  week: { width: "14.2857%" as const, textAlign: 'center', color: C.muted, fontSize: 12, fontWeight: '600', paddingVertical: 6 },
  cell: { width: "14.2857%" as const, aspectRatio: 0.95, alignItems: 'center', justifyContent: 'center', borderRadius: 10, gap: 2 },
  num: { color: C.text, fontSize: 14, fontWeight: '600' },
  price: { color: C.text, fontSize: 11, fontWeight: '700' },
}));
