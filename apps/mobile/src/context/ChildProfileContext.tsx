// apps/mobile/src/context/ChildProfileContext.tsx

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

const GUEST_CHILD_KEY = 'sturdy_guest_child';

export type ChildProfile = {
  id?: string;
  name: string;
  childAge: number;
  neurotype: string | null;
};

type ChildProfileContextValue = {
  activeChild: ChildProfile | null;
  children: ChildProfile[];
  isLoadingChild: boolean;
  setActiveChild: (profile: ChildProfile | null) => void;
  reloadChild: () => Promise<void>;
};

const ChildProfileContext = createContext<ChildProfileContextValue | null>(null);

export function ChildProfileProvider({ children: kids }: { children: ReactNode }) {
  const { user } = useAuth();
  const [activeChild, setActiveChildState] = useState<ChildProfile | null>(null);
  const [childrenList, setChildrenList] = useState<ChildProfile[]>([]);
  const [isLoadingChild, setIsLoadingChild] = useState(true);

  const loadChild = useCallback(async () => {
    setIsLoadingChild(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData?.session;

      if (session?.user) {
        const { data, error } = await supabase
          .from('child_profiles')
          .select('id, name, child_age, neurotype')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: true });

        if (!error && data && data.length > 0) {
          const mapped: ChildProfile[] = data.map(d => {
            const neurotypes = Array.isArray(d.neurotype) ? d.neurotype : [];
            return {
              id: d.id,
              name: d.name ?? '',
              childAge: d.child_age,
              neurotype: neurotypes.length > 0 ? neurotypes[0] : null,
            };
          });

          setChildrenList(mapped);
          setActiveChildState(prev => {
            if (prev?.id && mapped.some(c => c.id === prev.id)) return prev;
            return mapped[0];
          });
          return;
        }
      }

      // Guest — AsyncStorage
      const stored = await AsyncStorage.getItem(GUEST_CHILD_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as { name: string; childAge: number };
        if (parsed.name && parsed.childAge) {
          const guest: ChildProfile = {
            name: parsed.name,
            childAge: parsed.childAge,
            neurotype: null,
          };
          setChildrenList([guest]);
          setActiveChildState(guest);
          return;
        }
      }

      setChildrenList([]);
      setActiveChildState(null);
    } catch {
      setChildrenList([]);
      setActiveChildState(null);
    } finally {
      setIsLoadingChild(false);
    }
  }, []);

  // ✅ NEW: reload when user changes (sign in, sign out, switch account)
  useEffect(() => {
    setChildrenList([]);
    setActiveChildState(null);
    loadChild();
  }, [user?.id, loadChild]);

  const setActiveChild = useCallback((profile: ChildProfile | null) => {
    setActiveChildState(profile);
  }, []);

  const reloadChild = useCallback(async () => {
    await loadChild();
  }, [loadChild]);

  const value = useMemo<ChildProfileContextValue>(
    () => ({ activeChild, children: childrenList, isLoadingChild, setActiveChild, reloadChild }),
    [activeChild, childrenList, isLoadingChild, setActiveChild, reloadChild],
  );

  return (
    <ChildProfileContext.Provider value={value}>
      {kids}
    </ChildProfileContext.Provider>
  );
}

export function useChildProfile() {
  const ctx = useContext(ChildProfileContext);
  if (!ctx) throw new Error('useChildProfile must be used within ChildProfileProvider');
  return ctx;
}