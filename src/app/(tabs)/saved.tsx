import { Link, router } from 'expo-router';
import Head from 'expo-router/head';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Bar, Button, Card, Empty, Icon, P, Page, Row } from '../../components/ui';
import { t } from '../../i18n';
import { fetchFares } from '../../lib/api';
import { cheapest } from '../../lib/fares';
import { ago, day, monthLabel, peso, todayPH } from '../../lib/format';
import { resultsHref } from '../../lib/nav';
import { cityName } from '../../lib/places';
import { useApp } from '../../store/useApp';
import { C, themed } from '../../theme';

export default function Saved() {
  const saved = useApp((s) => s.saved);
  const update = useApp((s) => s.updateSaved);
  const remove = useApp((s) => s.removeSaved);
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
    setBusy(true);
    const today = todayPH();
    for (const sv of saved) {
      if (sv.q.depart < today.slice(0, sv.q.depart.length)) continue;
      const r = await fetchFares(sv.q);
      const best = cheapest(r.fares);
      if (best) update(sv.id, best.price, r.checkedAt);
    }
    setBusy(false);
  };

  return (
    <Page
      header={
        <>
          <Head>
            <title>{t('Saved searches · Lipad')}</title>
          </Head>
          <Bar title={t('Saved')} subtitle={t('Watch prices on routes you care about')} />
        </>
      }
    >
      {saved.length === 0 ? (
        <Empty
          icon="bookmark-outline"
          title={t('Nothing saved yet')}
          body={t('Tap the bookmark on any search to keep it here and check its price later.')}
          action={<Button label={t('Search flights')} onPress={() => router.navigate('/')} />}
        />
      ) : (
        <>
          <Button kind="soft" icon="refresh" label={busy ? t('Checking prices…') : t('Check prices now')} onPress={refresh} loading={busy} />
          {saved.map((sv) => {
            const diff = sv.lastPrice != null && sv.prevPrice != null ? sv.lastPrice - sv.prevPrice : 0;
            const past = sv.q.depart < todayPH().slice(0, sv.q.depart.length);
            return (
              <Card key={sv.id} style={past ? { opacity: 0.55 } : undefined}>
                <Row style={{ justifyContent: 'space-between' }}>
                  <Link href={resultsHref(sv.q)} asChild>
                    <Pressable style={{ flex: 1 }} accessibilityRole="link">
                      <Text style={s.route}>
                        {cityName(sv.q.from)} → {cityName(sv.q.to)}
                      </Text>
                      <Text style={s.meta}>
                        {sv.q.depart.length === 7 ? monthLabel(sv.q.depart) : day(sv.q.depart)}
                        {sv.q.ret ? ` – ${sv.q.ret.length === 7 ? monthLabel(sv.q.ret) : day(sv.q.ret)}` : ` · ${t('one-way')}`}
                        {past ? ` · ${t('date passed')}` : ''}
                      </Text>
                    </Pressable>
                  </Link>
                  <View style={{ alignItems: 'flex-end' }}>
                    {sv.lastPrice != null && <Text style={s.price}>{peso(sv.lastPrice)}</Text>}
                    {diff !== 0 && (
                      <Row gap={4}>
                        <Icon name={diff < 0 ? 'trending-down' : 'trending-up'} size={16} color={diff < 0 ? C.good : C.bad} />
                        <Text style={{ color: diff < 0 ? C.good : C.bad, fontSize: 13, fontWeight: '700' }}>{peso(Math.abs(diff))}</Text>
                      </Row>
                    )}
                    {sv.checkedAt && <Text style={s.meta}>{t('checked {ago}', { ago: ago(sv.checkedAt) })}</Text>}
                  </View>
                </Row>
                <Pressable onPress={() => remove(sv.id)} hitSlop={8} accessibilityRole="button" style={{ alignSelf: 'flex-start' }}>
                  <Text style={s.remove}>{t('Remove')}</Text>
                </Pressable>
              </Card>
            );
          })}
          <P muted small>
            {t('Saved on this device only. Prices are one adult, from recent searches.')}
          </P>
        </>
      )}
    </Page>
  );
}

const s = themed(() => ({
  route: { color: C.text, fontSize: 16, fontWeight: '700' },
  meta: { color: C.muted, fontSize: 13 },
  price: { color: C.primary, fontSize: 18, fontWeight: '800' },
  remove: { color: C.bad, fontSize: 13, fontWeight: '600' },
}));
