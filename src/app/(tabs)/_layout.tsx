import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import { ColorValue } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { t } from '../../i18n';
import { useApp } from '../../store/useApp';
import { C } from '../../theme';

type IconName = keyof typeof Ionicons.glyphMap;

function icon(active: IconName, inactive: IconName) {
  return ({ color, focused, size }: { color: ColorValue; focused: boolean; size: number }) => <Ionicons name={focused ? active : inactive} color={color} size={size} />;
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const saved = useApp((s) => s.saved.length);
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: C.primary,
        tabBarInactiveTintColor: C.muted,
        tabBarStyle: { height: 62 + insets.bottom, paddingBottom: insets.bottom, backgroundColor: C.card, borderTopColor: C.line },
        tabBarLabelStyle: { fontSize: 11, lineHeight: 14 },
        sceneStyle: { backgroundColor: C.bg },
      }}
    >
      <Tabs.Screen name="index" options={{ title: t('Flights'), tabBarIcon: icon('airplane', 'airplane-outline') }} />
      <Tabs.Screen name="plan" options={{ title: t('Plan a trip'), tabBarIcon: icon('wallet', 'wallet-outline') }} />
      <Tabs.Screen
        name="saved"
        options={{ title: t('Saved'), tabBarIcon: icon('bookmark', 'bookmark-outline'), tabBarBadge: saved || undefined, tabBarBadgeStyle: { backgroundColor: C.accent, fontSize: 10 } }}
      />
      <Tabs.Screen name="settings" options={{ title: t('Settings'), tabBarIcon: icon('settings', 'settings-outline') }} />
    </Tabs>
  );
}
