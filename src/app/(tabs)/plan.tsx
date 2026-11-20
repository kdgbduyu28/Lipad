import { router } from 'expo-router';
import Head from 'expo-router/head';
import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { PlaceField } from '../../components/Pickers';
import { Bar, Button, Card, Chip, H, P, Page, Row, Stepper, Wrap } from '../../components/ui';
import type { Style } from '../../data/spending';
import { t } from '../../i18n';
import { day, monthLabel, nextMonths, peso, todayPH } from '../../lib/format';
import { longWeekends } from '../../lib/holidays';
import type { Scope } from '../../lib/planner';
import { PlanDraft, useApp } from '../../store/useApp';
import { C, themed } from '../../theme';

const STEPS = ['Where from', 'Budget', 'When', 'Who is going', 'Where to', 'How long', 'Travel style'];
const BUDGETS = [5000, 10000, 15000, 20000, 30000, 50000, 80000];

export default function Plan() {
  const home = useApp((s) => s.settings.home);
  const saved = useApp((s) => s.plan);
  const setPlan = useApp((s) => s.setPlan);
  const months = nextMonths(12);
  const weekends = longWeekends(todayPH(), 6);
  const [p, setP] = useState<PlanDraft>(
    saved ?? { from: home, budget: 20000, when: 'month', month: months[1], depart: '', nights: 3, pax: { adults: 2, kids: 0, infants: 0 }, scope: 'any', style: 'sakto' },
  );
  const [step, setStep] = useState(0);
  const set = (x: Partial<PlanDraft>) => setP((cur) => ({ ...cur, ...x }));
  const last = step === STEPS.length - 1;
  const ok = [!!p.from, p.budget >= 1000, p.when === 'month' ? !!p.month : !!p.depart, p.pax.adults > 0, true, p.nights > 0, true][step];

  const finish = () => {
    setPlan(p);
    router.push('/trip');
  };

  return (
    <Page
      header={
        <>
          <Head>
            <title>{t('Plan a trip on a budget · Lipad')}</title>
          </Head>
          <Bar title={t('Plan a trip')} subtitle={t('Step {n} of {total}: {name}', { n: step + 1, total: STEPS.length, name: t(STEPS[step]) })} />
        </>
      }
    >
      <View style={s.progress}>
        <View style={[s.fill, { width: `${((step + 1) / STEPS.length) * 100}%` as `${number}%` }]} />
      </View>

      <Card>
        {step === 0 && (
          <>
            <H>{t('Where are you flying from?')}</H>
            <Row>
              <PlaceField label={t('From')} value={p.from} onChange={(from) => set({ from })} />
            </Row>
          </>
        )}
        {step === 1 && (
          <>
            <H>{t('What is your budget for the whole trip?')}</H>
            <P muted small>{t('Flights, place to stay, food and getting around, for everyone going.')}</P>
            <View style={s.money}>
              <Text style={s.peso}>₱</Text>
              <TextInput
                value={p.budget ? String(p.budget) : ''}
                onChangeText={(v) => set({ budget: Math.min(10_000_000, Number(v.replace(/\D/g, '')) || 0) })}
                keyboardType="number-pad"
                style={s.moneyInput}
                accessibilityLabel={t('Budget in pesos')}
              />
            </View>
            <Wrap>
              {BUDGETS.map((b) => (
                <Chip key={b} label={peso(b)} on={p.budget === b} onPress={() => set({ budget: b })} />
              ))}
            </Wrap>
          </>
        )}
        {step === 2 && (
          <>
            <H>{t('When do you want to go?')}</H>
            <Wrap>
              <Chip label={t('A month')} on={p.when === 'month'} onPress={() => set({ when: 'month' })} />
              <Chip label={t('A long weekend')} on={p.when === 'longweekend'} onPress={() => set({ when: 'longweekend', depart: weekends[0]?.start ?? '' })} />
            </Wrap>
            {p.when === 'month' ? (
              <Wrap>
                {months.map((m) => (
                  <Chip key={m} label={monthLabel(m)} on={p.month === m} onPress={() => set({ month: m })} />
                ))}
              </Wrap>
            ) : (
              <View style={{ gap: 8 }}>
                {weekends.map((w) => (
                  <Chip
                    key={w.start}
                    label={`${t(w.name)}: ${day(w.start)} – ${day(w.end)} (${t('{n} days', { n: w.days })})`}
                    on={p.depart === w.start}
                    onPress={() => set({ depart: w.start, nights: w.days - 1 })}
                  />
                ))}
                <P muted small>{t('Philippine holidays joined with weekends. Holidays set by proclamation may move.')}</P>
              </View>
            )}
          </>
        )}
        {step === 3 && (
          <>
            <H>{t('Who is going?')}</H>
            <Stepper label={t('Adults')} hint={t('12 and up')} value={p.pax.adults} min={1} onChange={(adults) => set({ pax: { ...p.pax, adults } })} />
            <Stepper label={t('Kids')} hint={t('2 to 11')} value={p.pax.kids} onChange={(kids) => set({ pax: { ...p.pax, kids } })} />
            <Stepper label={t('Infants')} hint={t('Under 2, on a lap')} value={p.pax.infants} max={p.pax.adults} onChange={(infants) => set({ pax: { ...p.pax, infants } })} />
          </>
        )}
        {step === 4 && (
          <>
            <H>{t('Where would you like to go?')}</H>
            <Wrap>
              {(['domestic', 'international', 'any'] as Scope[]).map((sc) => (
                <Chip key={sc} label={t(sc === 'domestic' ? 'Around the Philippines' : sc === 'international' ? 'Abroad' : 'Surprise me')} on={p.scope === sc} onPress={() => set({ scope: sc })} />
              ))}
            </Wrap>
          </>
        )}
        {step === 5 && (
          <>
            <H>{t('How many nights?')}</H>
            <Stepper label={t('Nights')} value={p.nights} min={1} max={21} onChange={(nights) => set({ nights })} />
          </>
        )}
        {step === 6 && (
          <>
            <H>{t('How do you like to travel?')}</H>
            {(
              [
                ['tipid', 'Tipid', 'Hostels or simple rooms, local eats, jeeps and buses'],
                ['sakto', 'Sakto', 'Good hotels, restaurants, Grab now and then'],
                ['sulit', 'Sulit', 'Nicer hotels, good meals, a tour or two'],
              ] as [Style, string, string][]
            ).map(([k, name, body]) => (
              <Chip key={k} label={`${name}: ${t(body)}`} on={p.style === k} onPress={() => set({ style: k })} />
            ))}
          </>
        )}
      </Card>

      <Row>
        <Button kind="ghost" label={t('Back')} onPress={() => setStep(step - 1)} disabled={step === 0} style={{ flex: 1 }} />
        <Button label={last ? t('Show trips') : t('Next')} icon={last ? 'sparkles' : 'arrow-forward'} onPress={() => (last ? finish() : setStep(step + 1))} disabled={!ok} style={{ flex: 2 }} />
      </Row>
    </Page>
  );
}

const s = themed(() => ({
  progress: { height: 6, backgroundColor: C.line, borderRadius: 3, overflow: 'hidden' },
  fill: { height: 6, backgroundColor: C.accent },
  money: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface, borderRadius: 12, paddingHorizontal: 14 },
  peso: { color: C.muted, fontSize: 22, fontWeight: '700' },
  moneyInput: { flex: 1, color: C.text, fontSize: 26, fontWeight: '800', paddingVertical: 10, paddingHorizontal: 8, outlineStyle: 'none' } as object,
}));
