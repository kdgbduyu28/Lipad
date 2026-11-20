import { router, useLocalSearchParams } from 'expo-router';
import Head from 'expo-router/head';
import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Bar, Button, Card, H, P, Page, Row, SampleBadge } from '../../components/ui';
import { POPULAR_ROUTES } from '../../data/routes';
import { t } from '../../i18n';
import { fetchCalendar } from '../../lib/api';
import { duration, monthLabel, nextMonths, peso } from '../../lib/format';
import { resultsHref } from '../../lib/nav';
import { cityName, countryName, distanceKm, isDomestic, place } from '../../lib/places';
import { C, themed } from '../../theme';

/** Pre-built at export time for each popular route, so search engines can index them. */
export function generateStaticParams(): { route: string }[] {
  return POPULAR_ROUTES.map(([a, b]) => ({ route: `${a}-${b}`.toLowerCase() }));
}

type MonthBest = { month: string; price?: number; sample: boolean };

export default function RoutePage() {
  const { route = '' } = useLocalSearchParams<{ route: string }>();
  const [from = '', to = ''] = route.toUpperCase().split('-');
  const known = !!place(from) && !!place(to);
  const a = cityName(from);
  const b = cityName(to);
  const km = distanceKm(from, to);
  const flyMins = km ? Math.round((km / 780) * 60 + 35) : undefined;
  const months = nextMonths(4);
  const [best, setBest] = useState<MonthBest[] | null>(null);

  useEffect(() => {
    if (!known) return;
    let live = true;
    Promise.all(
      months.map((m) =>
        fetchCalendar(from, to, m).then((c): MonthBest => ({ month: m, price: c.days.length ? Math.min(...c.days.map((d) => d.price)) : undefined, sample: c.sample })),
      ),
    ).then((r) => live && setBest(r));
    return () => {
      live = false;
    };
  }, [from, to]);

  const title = t('Cheap flights from {a} to {b}', { a, b });
  const desc = t('Compare recent fares from {a} ({from}) to {b} ({to}), find the cheapest days, and book on the airline or a trusted travel site.', { a, b, from, to });

  return (
    <Page
      header={
        <>
          <Head>
            <title>{`${title} · Lipad`}</title>
            <meta name="description" content={desc} />
            <meta property="og:title" content={title} />
            <meta property="og:description" content={desc} />
          </Head>
          <Bar title={title} subtitle={`${from} → ${to}`} onBack={() => (router.canGoBack() ? router.back() : router.replace('/'))} />
        </>
      }
    >
      {!known ? (
        <P>{t('We do not know this route.')}</P>
      ) : (
        <>
          <P>{desc}</P>
          <Card>
            <H>{t('Cheapest by month')}</H>
            <SampleBadge show={!!best?.some((x) => x.sample)} />
            <View style={s.grid}>
              {months.map((m) => {
                const row = best?.find((x) => x.month === m);
                return (
                  <Pressable key={m} onPress={() => router.push({ pathname: '/calendar', params: { from, to, month: m } })} style={s.month} accessibilityRole="link">
                    <Text style={s.mName}>{monthLabel(m)}</Text>
                    <Text style={s.mPrice}>{!best ? '…' : row?.price ? peso(row.price) : t('no data')}</Text>
                  </Pressable>
                );
              })}
            </View>
            <P muted small>{t('One-way, one adult, lowest fare travelers found recently.')}</P>
          </Card>
          <Card>
            <H>{t('About this route')}</H>
            <Row style={{ flexWrap: 'wrap' }} gap={16}>
              {!!km && <P small>{t('Distance: about {km} km', { km: Math.round(km).toLocaleString('en-PH') })}</P>}
              {!!flyMins && <P small>{t('Direct flight: about {d}', { d: duration(flyMins) })}</P>}
              <P small>{isDomestic(from, to) ? t('Domestic flight, no passport needed') : t('International: {country}', { country: countryName(place(to)!.country) })}</P>
            </Row>
          </Card>
          <Button label={t('Search {a} → {b} flights', { a, b })} icon="search" onPress={() => router.push(resultsHref({ from, to, depart: months[1], pax: { adults: 1, kids: 0, infants: 0 } }))} />
        </>
      )}
    </Page>
  );
}

const s = themed(() => ({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  month: { flexGrow: 1, flexBasis: 140, backgroundColor: C.surface, borderRadius: 12, padding: 12 },
  mName: { color: C.muted, fontSize: 13, fontWeight: '600' },
  mPrice: { color: C.primary, fontSize: 18, fontWeight: '800', marginTop: 2 },
}));
