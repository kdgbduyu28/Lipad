import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { setLang } from '../i18n';
import { useApp } from '../store/useApp';
import { C, Scheme, setScheme } from '../theme';

export default function RootLayout() {
  const system = useColorScheme();
  const pref = useApp((s) => s.settings.theme);
  const lang = useApp((s) => s.settings.lang);
  const scheme: Scheme = pref === 'system' ? (system === 'dark' ? 'dark' : 'light') : pref;
  // Swap palette and language before anything below renders; the key re-renders the tree.
  setScheme(scheme);
  setLang(lang);
  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
  const navTheme = { ...base, colors: { ...base.colors, primary: C.primary, background: C.bg, card: C.card, text: C.text, border: C.line } };

  return (
    <SafeAreaProvider>
      <ThemeProvider value={navTheme}>
        <View key={`${scheme}-${lang}`} style={{ flex: 1, backgroundColor: C.bg }}>
          <StatusBar style="light" />
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.bg } }} />
        </View>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
