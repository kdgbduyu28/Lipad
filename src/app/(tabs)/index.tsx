import { Link, router } from 'expo-router';
import Head from 'expo-router/head';
import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SearchForm } from '../../components/SearchForm';
import { Card, H, Icon, P, Page, Row, SampleBadge, Wrap, styles as ui } from '../../components/ui';
import { POPULAR_ROUTES } from '../../data/routes';
import { t } from '../../i18n';
import { fetchPopular } from '../../lib/api';
import { day, monthLabel, nextMonths, peso } from '../../lib/format';
import { resultsHref, routeSlug } from '../../lib/nav';
import { cityName } from '../../lib/places';
import type { FaresResponse } from '../../lib/types';
import { useApp } from '../../store/useApp';
import { C, themed } from '../../theme';

export default function Home() {
  const insets = useSafeAreaInsets();
  const home = useApp((s) => s.settings.home);
  const recent = useApp((s) => s.recent);
  const clearRecent = useApp((s) => s.clearRecent);
  const month = nextMonths(2)[1];
  const [deals, setDeals] = useState<FaresResponse | null>(null);

  useEffect(() => {
    let live = true;
    setDeals(null);
    fetchPopular(home, month).then((d) => live && setDeals(d));
    return () => {
      live = false;
    };
  }, [home, month]);

  return (
    <Page
      pad={false}
      header={
        <Head>
          <title>{t('Lipad: cheap flights from the Philippines')}</title>
          <meta name="description" content="Find cheap flights from the Philippines, compare fares by day, and plan a trip that fits your budget. Free, no sign-up." />
        </Head>
      }
    >
      <View style={[s.hero, { paddingTop: insets.top + 20 }]}>
        <View style={[ui.column, { paddingHorizontal: 16, gap: 6 }]}>
          <Row>
            <Icon name="paper-plane" color={C.onColor} size={22} />
            <Text style={s.brand}>Lipad</Text>
          </Row>
          <Text style={s.tagline}>{t('Find cheap flights and trips that fit your budget.')}</Text>
        </View>
      </View>
      <View style={[ui.column, ui.pad, { marginTop: -56 }]}>
        <SearchForm />

        <Pressable onPress={() => router.push('/plan')} style={s.plan} accessibilityRole="button">
          <View style={s.planIcon}>
            <Icon name="wallet" color={C.accent} size={22} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.planTitle}>{t('Where can I go with my budget?')}</Text>
            <Text style={s.planSub}>{t('Answer a few questions and see trips that fit, flights and spending money included.')}</Text>
          </View>
          <Icon name="chevron-forward" color={C.muted} />
        </Pressable>

        {recent.length > 0 && (
          <View style={{ gap: 8 }}>
            <Row style={{ justifyContent: 'space-between' }}>
              <H>{t('Recent searches')}</H>
              <Pressable onPress={clearRecent} hitSlop={8}>
                <Text style={s.link}>{t('Clear')}</Text>
              </Pressable>
            </Row>
            <Wrap>
              {recent.map((q) => (
                <Link key={`${q.from}${q.to}${q.depart}${q.ret}`} href={resultsHref(q)} asChild>
                  <Pressable style={s.recent}>
                    <Text style={s.recentTitle}>
                      {q.from} → {q.to}
                    </Text>
                    <Text style={s.recentSub}>{q.depart.length === 7 ? monthLabel(q.depart) : day(q.depart)}</Text>
                  </Pressable>
                </Link>
              ))}
            </Wrap>
          </View>
        )}

        <View style={{ gap: 10 }}>
          <H>{t('Cheapest from {city} in {month}', { city: cityName(home), month: monthLabel(month) })}</H>
          <SampleBadge show={!!deals?.sample} />
          {!deals ? (
            <P muted>{t('Loading deals…')}</P>
          ) : deals.fares.length === 0 ? (
            <P muted>{t('No recent fares from here yet. Try a search above.')}</P>
          ) : (
            <View style={s.deals}>
              {deals.fares.slice(0, 12).map((f) => (
                <Link key={f.to} href={resultsHref({ from: home, to: f.to, depart: month, pax: { adults: 1, kids: 0, infants: 0 } })} asChild>
                  <Pressable style={s.deal} accessibilityRole="link">
                    <Text style={s.dealCity} numberOfLines={1}>
                      {cityName(f.to)}
                    </Text>
                    <Text style={s.dealMeta}>{day(f.departAt)}</Text>
                    <Text style={s.dealPrice}>{peso(f.price)}</Text>
                  </Pressable>
                </Link>
              ))}
            </View>
          )}
          <P muted small>
            {t('One-way, one adult, seen recently by travelers. Tap to see dates and booking sites.')}
          </P>
        </View>

        <Card>
          <H>{t('Popular routes')}</H>
          <Wrap>
            {POPULAR_ROUTES.slice(0, 16).map(([a, b]) => (
              <Link key={a + b} href={`/flights/${routeSlug(a, b)}`} style={s.route}>
                {cityName(a)} → {cityName(b)}
              </Link>
            ))}
          </Wrap>
        </Card>
      </View>
    </Page>
  );
}

const s = themed(() => ({
  hero: { backgroundColor: C.brand, paddingBottom: 72 },
  brand: { color: C.onColor, fontSize: 24, fontWeight: '800', letterSpacing: 0.3 },
  tagline: { color: C.onColor, opacity: 0.92, fontSize: 16 },
  plan: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.accentSoft, borderRadius: 16, padding: 14 },
  planIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.card, alignItems: 'center', justifyContent: 'center' },
  planTitle: { color: C.text, fontSize: 16, fontWeight: '700' },
  planSub: { color: C.muted, fontSize: 13, marginTop: 2 },
  link: { color: C.link, fontWeight: '600' },
  recent: { backgroundColor: C.card, borderRadius: 12, paddingVertical: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: C.line },
  recentTitle: { color: C.text, fontWeight: '700', fontSize: 14 },
  recentSub: { color: C.muted, fontSize: 12 },
  deals: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  deal: { flexGrow: 1, flexBasis: 150, maxWidth: 230, backgroundColor: C.card, borderRadius: 14, padding: 12, borderWidth: 1, borderColor: C.line, gap: 2 },
  dealCity: { color: C.text, fontWeight: '700', fontSize: 15 },
  dealMeta: { color: C.muted, fontSize: 12 },
  dealPrice: { color: C.primary, fontWeight: '800', fontSize: 18, marginTop: 4 },
  route: { color: C.link, fontSize: 14, fontWeight: '600', paddingVertical: 6, paddingHorizontal: 10, backgroundColor: C.primarySoft, borderRadius: 999, overflow: 'hidden' },
}));
