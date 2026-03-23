import { Redirect } from 'expo-router';

export default function Index() {
  // TODO: 检查登录状态，已登录跳转到主页，未登录跳转到登录页
  return <Redirect href="/(auth)/login" />;
}
