'use client'
// src/components/providers/session-provider.tsx
// Wrapper client per NextAuth SessionProvider

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react'

export function SessionProvider({ children }: { children: React.ReactNode }) {
  return <NextAuthSessionProvider>{children}</NextAuthSessionProvider>
}
