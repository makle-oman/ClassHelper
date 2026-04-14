import { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { getToken, classApi } from '../src/services/api';

export default function Index() {
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const token = await getToken();
        if (token) {
          // 验证token是否仍然有效（若401，request拦截器会自动清除auth并跳转登录页）
          await classApi.list();
          router.replace('/(tabs)/');
        } else {
          router.replace('/(auth)/login');
        }
      } catch {
        // 如果验证失败（401已被request.ts处理），走登录页
        router.replace('/(auth)/login');
      } finally {
        setChecking(false);
      }
    })();
  }, []);

  if (checking) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#4CC590" />
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
