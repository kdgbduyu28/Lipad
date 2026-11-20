import { router, useLocalSearchParams } from 'expo-router';
import Head from 'expo-router/head';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { BookSheet, FareCard, airline } from '../components/FareCard';
import { Bar, Button, Chip, Empty, Icon, Loading, P, Page, Row, SampleBadge, Wrap } from '../components/ui';
import { t } from '../i18n';
import { fetchFares } from '../lib/api';
import { SortBy, airlinesIn, cheapest, filterFares, sortFares, validateSearch } from '../lib/fares';
import { ago, day, monthLabel, todayPH } from '../lib/format';
import { fromParams } from '../lib/nav';
import { cityName } from '../lib/places';
import type { Fare, FaresResponse } from '../lib/types';
import { savedId, useApp } from '../store/useApp';
import { C } from '../theme';

export default function Results() {
  const params = useLocalSearchParams();
  const q = useMemo(() => fromParams(params), [JSON.stringify(params)]);
  const problem = q.from ? validateSearch(q, todayPH()) : null;
  const [data, setData] = useState<FaresResponse | null>(null);
  const [sort, setSort] = useState<SortBy>('price');
  const [maxStops, setMaxStops] = useState<number | undefined>(q.directOnly ? 0 : undefined);
  const [only, setOnly] = useState<string[]>([]);
  const [book, setBook] = useState<Fare | null>(null);
  const saved = useApp((s) => s.saved.some((x) => x.id === savedId(q)));
  const toggleSaved = useApp((s) => s.toggleSaved);

  useEffect(() => {
    if (!q.from || problem) return;
    let live = true;
    setData(null);
    fetchFares(q).then((d) => live && setData(d));
    return () => {
      live = false;
    };
  }, [q, problem]);

  const list = data ? sortFares(filterFares(data.fares, { maxStops, airlines: only }), sort) : [];
  const best = data ? cheapest(data.fares) : undefined;
  const carriers = data ? airlinesIn(data.fares) : [];
  const when = q.depart ? (q.depart.length === 7 ? monthLabel(q.depart) : day(q.depart)) : '';
  const title = q.from && q.to ? `${cityName(q.from)} → ${cityName(q.to)}` : t('Flights');
  const back = () => (router.canGoBack() ? router.back() : router.replace('/'));

  return (
    <Page
      header={
        <>
          <Head>
            <title>{`${title} · Lipad`}</title>
          </Head>
          <Bar
            title={title}
            subtitle={[when, q.ret ? t('round trip') : t('one-way'), q.pax.adults + q.pax.kids + q.pax.infants > 1 ? t('{n} travelers', { n: q.pax.adults + q.pax.kids + q.pax.infants }) : ''].filter(Boolean).join(' · ')}
            onBack={back}
            right={
              q.from ? (
                <Pressable onPress={() => toggleSaved(q, best?.price)} hitSlop={10} accessibilityRole="button" accessibilityLabel={saved ? t('Remove from saved') : t('Save search')}>
                  <Icon name={saved ? 'bookmark' : 'bookmark-outline'} color={C.onColor} size={22} />
                </Pressable>
              ) : undefined
            }
          />
        </>
      }
    >
      {!q.from ? (
        <Loading />
      ) : problem ? (
        <Empty icon="alert-circle-outline" title={t(problem)} action={<Button label={t('Change search')} onPress={back} />} />
      ) : !data ? (
        <Loading label={t('Finding fares…')} />
      ) : (
        <>
          <SampleBadge show={data.sample} />
          <Row style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <P muted small>
              {data.fares.length ? t('{n} fares · updated {ago}', { n: data.fares.length, ago: ago(data.checkedAt) }) : ''}
            </P>
            {!!q.to && (
              <Pressable
                onPress={() => router.push({ pathname: '/calendar', params: { from: q.from, to: q.to, month: q.depart.slice(0, 7), a: String(q.pax.adults) } })}
                style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}
                accessibilityRole="button"
              >
                <Icon name="calendar-outline" color={C.link} size={18} />
                <Text style={{ color: C.link, fontWeight: '700' }}>{t('Price calendar')}</Text>
              </Pressable>
            )}
          </Row>
          {data.fares.length > 0 && (
            <View style={{ gap: 8 }}>
              <Wrap>
                <Chip label={t('Cheapest')} on={sort === 'price'} onPress={() => setSort('price')} />
                <Chip label={t('Fastest')} on={sort === 'duration'} onPress={() => setSort('duration')} />
                <Chip label={t('Fewest stops')} on={sort === 'stops'} onPress={() => setSort('stops')} />
                <Chip label={t('Direct only')} icon="flash-outline" on={maxStops === 0} onPress={() => setMaxStops(maxStops === 0 ? undefined : 0)} />
              </Wrap>
              {carriers.length > 1 && (
                <Wrap>
                  {carriers.map((c) => (
                    <Chip key={c} label={airline(c)} on={only.includes(c)} onPress={() => setOnly(only.includes(c) ? only.filter((x) => x !== c) : [...only, c])} />
                  ))}
                </Wrap>
              )}
            </View>
          )}
          {data.fares.length === 0 ? (
            <Empty
              icon="airplane-outline"
              title={t('No recent prices for this route')}
              body={t('Prices come from what travelers searched lately. Try the whole month, a nearby airport, or allow stops.')}
              action={
                <Row>
                  {q.depart.length === 10 && <Button kind="soft" label={t('Whole month')} onPress={() => router.setParams({ depart: q.depart.slice(0, 7) })} />}
                  {q.directOnly && <Button kind="soft" label={t('Allow stops')} onPress={() => router.setParams({ direct: '' })} />}
                </Row>
              }
            />
          ) : list.length === 0 ? (
            <Empty icon="filter-outline" title={t('No fares match these filters')} action={<Button kind="soft" label={t('Clear filters')} onPress={() => (setOnly([]), setMaxStops(undefined))} />} />
          ) : (
            <View style={{ gap: 14 }}>
              {list.map((f, i) => (
                <FareCard key={`${f.departAt}${f.airline}${f.price}${i}`} fare={f} pax={q.pax} checkedAt={data.checkedAt} badge={f === best ? t('Cheapest') : undefined} onPress={() => setBook(f)} />
              ))}
            </View>
          )}
          <P muted small>
            {t('Prices are for one adult, in pesos, from recent searches, and can change. Totals for groups are estimates. You book and pay on the site you choose.')}
          </P>
        </>
      )}
      <BookSheet fare={book} pax={q.pax} onClose={() => setBook(null)} />
    </Page>
  );
}
