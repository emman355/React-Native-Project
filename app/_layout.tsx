import { AuthProvider, useAuth } from '@/lib/auth-context';
import { Stack, useRouter, useSegments } from 'expo-router';
import React, { useEffect } from 'react';

function RouteGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { user, isLoadingUser } = useAuth()
  const segments = useSegments()

  useEffect(() => {
    const inAuthgroup = segments[0] === 'auth'
    if (!user && !inAuthgroup && !isLoadingUser) {
      router.replace('/auth')
    } else if (user && inAuthgroup && !isLoadingUser) {
      router.replace('/')
    }
  }, [user, segments, router, isLoadingUser])


  return children
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RouteGuard>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
      </RouteGuard>
    </AuthProvider>

  )

}
