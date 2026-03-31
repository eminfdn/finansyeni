import { Stack } from 'expo-router';
import React from 'react';
import { Colors } from '@/constants/colors';

export default function AnalyzeLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Colors.dark.background },
        headerTintColor: Colors.dark.text,
        headerTitleStyle: { fontWeight: '700' as const },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="result" options={{ title: 'Analiz Sonucu', presentation: 'modal' }} />
    </Stack>
  );
}
