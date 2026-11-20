import Head from 'expo-router/head';
import { Bar, Card, Chip, H, P, Page, Wrap } from '../../components/ui';
import { t } from '../../i18n';
import { PH_HOMES, cityName } from '../../lib/places';
import { useApp } from '../../store/useApp';

export default function Settings() {
  const st = useApp((s) => s.settings);
  const set = useApp((s) => s.setSettings);
  const setDraft = useApp((s) => s.setDraft);
  return (
    <Page
      header={
        <>
          <Head>
            <title>{t('Settings · Lipad')}</title>
          </Head>
          <Bar title={t('Settings')} />
        </>
      }
    >
      <Card>
        <H>{t('Home airport')}</H>
        <P muted small>{t('Used for deals and as the starting point for searches.')}</P>
        <Wrap>
          {PH_HOMES.map((c) => (
            <Chip
              key={c}
              label={`${cityName(c)} · ${c}`}
              on={st.home === c}
              onPress={() => {
                set({ home: c });
                setDraft({ from: c });
              }}
            />
          ))}
        </Wrap>
      </Card>
      <Card>
        <H>{t('Language')}</H>
        <Wrap>
          <Chip label="English" on={st.lang === 'en'} onPress={() => set({ lang: 'en' })} />
          <Chip label="Filipino" on={st.lang === 'fil'} onPress={() => set({ lang: 'fil' })} />
        </Wrap>
      </Card>
      <Card>
        <H>{t('Appearance')}</H>
        <Wrap>
          <Chip label={t('Match device')} on={st.theme === 'system'} onPress={() => set({ theme: 'system' })} />
          <Chip label={t('Light')} on={st.theme === 'light'} onPress={() => set({ theme: 'light' })} />
          <Chip label={t('Dark')} on={st.theme === 'dark'} onPress={() => set({ theme: 'dark' })} />
        </Wrap>
      </Card>
      <Card>
        <H>{t('About Lipad')}</H>
        <P small>
          {t('Lipad finds cheap flights from the Philippines and plans trips that fit your budget. It shows fares other travelers found recently, so prices can be a few hours or days old; the booking site always has the final price.')}
        </P>
        <P small>
          {t('Lipad never sells tickets or takes payment. "Book" opens the airline or a travel site. Some links may earn Lipad a small commission at no cost to you.')}
        </P>
        <P muted small>
          {t('Data: fares and airports from Travelpayouts/Aviasales, weather from Open-Meteo, exchange rates from Frankfurter (ECB). Searches and saved routes stay on this device.')}
        </P>
      </Card>
    </Page>
  );
}
