import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { t } from '../i18n';
import { travellers, validateSearch } from '../lib/fares';
import { todayPH } from '../lib/format';
import { resultsHref } from '../lib/nav';
import { useApp } from '../store/useApp';
import { C, themed } from '../theme';
import { DateField, PlaceField, Sheet } from './Pickers';
import { Button, Chip, Icon, Row, Stepper } from './ui';

export function SearchForm() {
  const q = useApp((s) => s.draft);
  const set = useApp((s) => s.setDraft);
  const addRecent = useApp((s) => s.addRecent);
  const [round, setRound] = useState(!!q.ret);
  const [paxOpen, setPaxOpen] = useState(false);
  const query = { ...q, ret: round ? q.ret : undefined };
  const problem = validateSearch(query, todayPH());
  const n = travellers(q.pax);

  const go = () => {
    if (problem) return;
    addRecent(query);
    router.push(resultsHref(query));
  };

  return (
    <View style={s.card}>
      <Row>
        <Chip label={t('One-way')} on={!round} onPress={() => setRound(false)} />
        <Chip label={t('Round trip')} on={round} onPress={() => setRound(true)} />
      </Row>
      <View>
        <Row>
          <PlaceField label={t('From')} value={q.from} onChange={(from) => set({ from })} exclude={q.to} />
        </Row>
        <Pressable onPress={() => set({ from: q.to, to: q.from })} style={s.swap} accessibilityRole="button" accessibilityLabel={t('Swap from and to')} hitSlop={6}>
          <Icon name="swap-vertical" size={18} color={C.primary} />
        </Pressable>
        <Row style={{ marginTop: 8 }}>
          <PlaceField label={t('To')} value={q.to} onChange={(to) => set({ to })} exclude={q.from} />
        </Row>
      </View>
      <Row>
        <DateField label={t('Depart')} value={q.depart} onChange={(depart) => set({ depart, ret: q.ret && q.ret < depart ? '' : q.ret })} />
        {round && <DateField label={t('Return')} value={q.ret ?? ''} min={q.depart.length === 10 ? q.depart : undefined} onChange={(ret) => set({ ret })} />}
      </Row>
      <Row>
        <Pressable onPress={() => setPaxOpen(true)} style={s.pax} accessibilityRole="button">
          <Icon name="people-outline" size={18} color={C.muted} />
          <Text style={s.paxText}>{n === 1 ? t('1 traveler') : t('{n} travelers', { n })}</Text>
        </Pressable>
        <Chip label={t('Direct only')} icon="flash-outline" on={!!q.directOnly} onPress={() => set({ directOnly: !q.directOnly })} />
      </Row>
      {problem && (q.to || q.depart) ? <Text style={s.problem}>{t(problem)}</Text> : null}
      <Button label={t('Search flights')} icon="search" onPress={go} disabled={!!problem} />
      <Sheet open={paxOpen} title={t('Who is flying?')} onClose={() => setPaxOpen(false)}>
        <Stepper label={t('Adults')} hint={t('12 and up')} value={q.pax.adults} min={1} onChange={(adults) => set({ pax: { ...q.pax, adults } })} />
        <Stepper label={t('Kids')} hint={t('2 to 11, usually close to the adult fare')} value={q.pax.kids} onChange={(kids) => set({ pax: { ...q.pax, kids } })} />
        <Stepper label={t('Infants')} hint={t('Under 2, on a lap, about 10% of the fare')} value={q.pax.infants} max={q.pax.adults} onChange={(infants) => set({ pax: { ...q.pax, infants } })} />
        <Button label={t('Done')} onPress={() => setPaxOpen(false)} />
      </Sheet>
    </View>
  );
}

const s = themed(() => ({
  card: { backgroundColor: C.card, borderRadius: 18, padding: 16, gap: 12, borderWidth: 1, borderColor: C.line, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 16, shadowOffset: { width: 0, height: 6 } },
  swap: { position: 'absolute', right: 14, top: 42, width: 34, height: 34, borderRadius: 17, backgroundColor: C.card, borderWidth: 1, borderColor: C.line, alignItems: 'center', justifyContent: 'center', zIndex: 2 },
  pax: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.surface, borderRadius: 12, paddingHorizontal: 14, minHeight: 44 },
  paxText: { color: C.text, fontSize: 15, fontWeight: '600' },
  problem: { color: C.bad, fontSize: 13 },
}));
