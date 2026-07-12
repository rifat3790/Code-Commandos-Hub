'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter, usePathname } from 'next/navigation';
import PageLoader from '@/components/PageLoader';

interface AuthContextType {
  user: User | null;
  dbUser: any | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, dbUser: null, loading: true });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [dbUser, setDbUser] = useState<any | null>(() => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('cached_db_user');
      return cached ? JSON.parse(cached) : null;
    }
    return null;
  });
  const [loading, setLoading] = useState(() => {
    if (typeof window !== 'undefined') {
      return !localStorage.getItem('cached_db_user');
    }
    return true;
  });
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        const cached = localStorage.getItem('cached_db_user');
        if (!cached) {
          setLoading(true);
        }

        try {
          // 1. Sync User to MongoDB (creates or updates lastLoginAt)
          await fetch('/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              firebaseUid: currentUser.uid,
              email: currentUser.email,
              name: currentUser.displayName,
              photoURL: currentUser.photoURL
            })
          });

          // 2. Fetch User from MongoDB
          const res = await fetch(`/api/users/me?uid=${currentUser.uid}`);
          const data = await res.json();
          if (data.success) {
            if (data.user.role === 'banned') {
              localStorage.removeItem('cached_db_user');
              await signOut(auth);
              setDbUser(null);
              router.push('/login?error=account_suspended');
            } else {
              setDbUser(data.user);
              localStorage.setItem('cached_db_user', JSON.stringify(data.user));
            }
          }
        } catch (e) {
          console.error("Error syncing user data to DB:", e);
        }
      } else {
        localStorage.removeItem('cached_db_user');
        setDbUser(null);
        if (pathname !== '/login') {
          router.push('/login');
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [pathname, router]);

  return (
    <AuthContext.Provider value={{ user, dbUser, loading }}>
      {!loading ? children : <PageLoader />}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
