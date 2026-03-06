import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useStore } from '@/lib/store';
import { colors } from '@/lib/theme';

export default function AppEntry() {
  const router = useRouter();
  const { isReady, userSettings } = useStore();

  useEffect(() => {
    if (isReady) {
      // isReady가 true가 된 직후에 라우팅 처리
      const timer = setTimeout(() => {
        if (userSettings) {
          router.replace('/(tabs)');
        } else {
          router.replace('/onboarding');
        }
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isReady, userSettings, router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  }
});
