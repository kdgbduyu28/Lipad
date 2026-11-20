import { router } from 'expo-router';
import Head from 'expo-router/head';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { Bar, Button, Card, Empty, Icon, Loading, P, Page, Row, SampleBadge } from '../components/ui';
import { t } from '../i18n';
import { fetchFares, fetchPopular } from '../lib/api';
import { CURRENCY, Weather, pesoPer, weatherFor } from '../lib/extras';
import { day, monthLabel, peso, todayPH } from '../lib/format';
import { resultsHref } from '../lib/nav';
import { PlanResult, applyRoundTrips, planTrips, tripDates } from '../lib/planner';
import { cityName, countryName, place } from '../lib/places';
import { shift } from '../lib/holidays';
import { useApp } from '../store/useApp';
import { C, themed } from '../theme';

export default function Trip() {
  const plan = useApp((s) => s.plan);
  const [rows, setRows] = useState<PlanResult[] | null>(null);
  const [sample, setSample] = useState(false);
  const [refining, setRefining] = useState(false);
  const depart = plan ? (plan.when === 'month' ? plan.month : plan.depart) : '';

  useEffect(() => {
    if (!plan) return;
    let live = true;
    setRows(null);
    const input = { ...plan, depart };
    (async () => {
      const d = await fetchPopular(plan.from, depart.slice(0, 7));
      if (!live) return;
      setSample(d.sample);
      const first = planTrips(input, d.fares);
      setRows(first);
      // Then check real round-trip fares for the top picks and re-rank.
      const top = first.slice(0, 8);
      if (!top.length) return;
      setRefining(true);
      const found = await Promise.all(
        top.map(async (r) => {
          const { depart: dep, ret } = tripDates(input, r.fare);
          const res = await fetchFares({ from: plan.from, to: r.to, depart: dep, ret, pax: plan.pax });
          return res.fares;
        }),
      );
      if (!live) return;
      setRows(planTrips(input, applyRoundTrips(d.fares, found.flat())));
      setRefining(false);
    })();
    return () => {
      live = false;
    };
  }, [plan, depart]);

  if (!plan) {
    return (
      <Page header={<Bar title={t('Trips that fit')} onBack={() => router.replace('/plan')} />}>
        <Empty icon="wallet-outline" title={t('Start with a few questions')} action={<Button label={t('Plan a trip')} onPress={() => router.replace('/plan')} />} />
      </Page>
    );
  }

  const fits = rows?.some((r) => r.fits);
  const when = depart.length === 7 ? monthLabel(depart) : day(depart);
  const people = plan.pax.adults + plan.pax.kids + plan.pax.infants;

  return (
    <Page
      header={
        <>
          <Head>
            <title>{t('Trips that fit · Lipad')}</title>
          </Head>
          <Bar
            title={t('Trips for {budget}', { budget: peso(plan.budget) })}
            subtitle={`${t('From {city}', { city: cityName(plan.from) })} · ${when} · ${t('{n} nights', { n: plan.nights })} · ${t('{n} going', { n: people })}`}
            onBack={() => (router.canGoBack() ? router.back() : router.replace('/plan'))}
          />
        </>
      }
    >
      <SampleBadge show={sample} />
      {!rows ? (
        <Loading label={t('Checking fares and costs…')} />
      ) : rows.length === 0 ? (
        <Empty icon="search-outline" title={t('No trips to show yet')} body={t('We have no recent fares from here for that month. Try another month or a bigger airport.')} action={<Button label={t('Change answers')} onPress={() => router.back()} />} />
      ) : (
        <>
          {!fits && (
            <Card style={{ backgroundColor: C.warnSoft, borderColor: C.warnSoft }}>
              <Text style={s.title}>{t('Nothing fits {budget} yet', { budget: peso(plan.budget) })}</Text>
              <P small>{t('These come closest. Try fewer nights, the tipid style, or another month.')}</P>
            </Card>
          )}
          {fits && <P muted>{t('{n} trips fit your budget, most money left first.', { n: rows.length })}</P>}
          {refining && <P muted small>{t('Checking real round-trip fares for the top picks…')}</P>}
          {rows.slice(0, 20).map((r) => (
            <TripCard key={r.to} r={r} plan={plan} depart={depart} />
          ))}
          <P muted small>
            {t('Estimates. Flights use real round-trip fares where found, otherwise the cheapest one-way fare times two; kids at the adult fare, infants at 10%. Daily costs are typical for the style you picked. Check final prices before you book.')}
          </P>
        </>
      )}
    </Page>
  );
}

function TripCard({ r, plan, depart }: { r: PlanResult; plan: NonNullable<ReturnType<typeof useApp.getState>['plan']>; depart: string }) {
  const [wx, setWx] = useState<Weather | null>(null);
  const [rate, setRate] = useState<number | null>(null);
  const start = r.fare.departAt.slice(0, 10);
  const p = place(r.to);
  const cur = p && p.country !== 'PH' ? CURRENCY[p.country] : undefined;

  useEffect(() => {
    weatherFor(r.to, start, plan.nights, todayPH()).then(setWx);
    if (cur) pesoPer(cur).then(setRate);
  }, [r.to, start, plan.nights, cur]);

  const pct = Math.min(100, Math.round((r.total / plan.budget) * 100));
  const ret = r.fare.returnAt ? r.fare.returnAt.slice(0, 10) : shift(start, plan.nights);

  return (
    <Card>
      <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flex: 1 }}>
          <Text style={s.city}>{cityName(r.to)}</Text>
          <Text style={s.meta}>{p ? countryName(p.country) : r.to}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={[s.total, { color: r.fits ? C.good : C.bad }]}>{peso(r.total)}</Text>
          <Text style={[s.meta, { color: r.fits ? C.good : C.bad, fontWeight: '700' }]}>
            {r.fits ? t('{left} left', { left: peso(r.left) }) : t('{short} over', { short: peso(-r.left) })}
          </Text>
        </View>
      </Row>
      <View style={s.bar}>
        <View style={[s.barFill, { width: `${pct}%` as `${number}%`, backgroundColor: r.fits ? C.good : C.bad }]} />
      </View>
      <Row gap={6}>
        <Icon name="calendar-outline" size={16} color={C.primary} />
        <Text style={s.dates}>{t('Cheapest dates: {a} – {b}', { a: day(start), b: day(ret) })}</Text>
      </Row>
      <Row gap={16} style={{ flexWrap: 'wrap' }}>
        <Line icon="airplane-outline" label={r.roundTrip ? t('Round-trip flights') : t('Flights (est.)')} value={peso(r.flights)} />
        <Line icon="bed-outline" label={t('Stay, food, rides')} value={`${peso(r.stay)} (${peso(r.perDay)}/${t('day')})`} />
      </Row>
      <Row gap={16} style={{ flexWrap: 'wrap' }}>
        {wx && (
          <Line
            icon={wx.rainyDays > wx.days / 2 ? 'rainy-outline' : 'sunny-outline'}
            label={wx.kind === 'forecast' ? t('Forecast') : t('Last year, same dates')}
            value={`${wx.low}–${wx.high}°C · ${t('rain {n} of {d} days', { n: wx.rainyDays, d: wx.days })}`}
          />
        )}
        {!!cur && !!rate && <Line icon="cash-outline" label={cur} value={`1 ${cur} ≈ ₱${rate < 0.1 ? rate.toFixed(4) : rate.toFixed(2)}`} />}
      </Row>
      <Button
        kind="soft"
        label={r.roundTrip ? t('See round trips from {price}', { price: peso(r.fare.price) }) : t('See flights from {price}', { price: peso(r.fare.price) })}
        icon="search"
        onPress={() => router.push(resultsHref({ from: plan.from, to: r.to, depart: start, ret, pax: plan.pax }))}
      />
    </Card>
  );
}

function Line({ icon, label, value }: { icon: React.ComponentProps<typeof Icon>['name']; label: string; value: string }) {
  return (
    <Row gap={6} style={{ minWidth: 200, flexShrink: 1 }}>
      <Icon name={icon} size={16} color={C.muted} />
      <Text style={s.meta}>{label}:</Text>
      <Text style={s.value}>{value}</Text>
    </Row>
  );
}

const s = themed(() => ({
  title: { color: C.text, fontSize: 16, fontWeight: '700' },
  city: { color: C.text, fontSize: 20, fontWeight: '800' },
  total: { fontSize: 20, fontWeight: '800' },
  meta: { color: C.muted, fontSize: 13 },
  value: { color: C.text, fontSize: 13, fontWeight: '600', flexShrink: 1 },
  dates: { color: C.primary, fontSize: 14, fontWeight: '700', flexShrink: 1 },
  bar: { height: 6, backgroundColor: C.line, borderRadius: 3, overflow: 'hidden' },
  barFill: { height: 6 },
}));
