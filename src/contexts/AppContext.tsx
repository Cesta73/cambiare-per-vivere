import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';
import type { Profile } from '../lib/supabase';
import {
  demoProfile, demoMeasurements, demoDailyCheckin,
  demoJournalEntries, demoActivities, demoWorkShifts,
  demoMedications, demoAppointments, demoHabits, demoHabitLogs,
  demoPersonalGoals, demoHungerEntries, demoFavoriteMeals,
  demoShoppingList, demoShoppingItems, DEMO_USER_ID
} from '../lib/demo';

export type AppTab = 'oggi' | 'settimana' | 'diario' | 'progressi' | 'altro';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface AppContextValue {
  user: User | null;
  profile: Profile | null;
  isDemo: boolean;
  isLoading: boolean;
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  toasts: Toast[];
  showToast: (message: string, type?: Toast['type']) => void;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  enterDemoMode: () => void;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  demoData: {
    measurements: typeof demoMeasurements;
    checkin: typeof demoDailyCheckin;
    journalEntries: typeof demoJournalEntries;
    activities: typeof demoActivities;
    workShifts: typeof demoWorkShifts;
    medications: typeof demoMedications;
    appointments: typeof demoAppointments;
    habits: typeof demoHabits;
    habitLogs: typeof demoHabitLogs;
    goals: typeof demoPersonalGoals;
    hungerEntries: typeof demoHungerEntries;
    favoriteMeals: typeof demoFavoriteMeals;
    shoppingList: typeof demoShoppingList;
    shoppingItems: typeof demoShoppingItems;
  };
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<AppTab>('oggi');
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const savedDemo = localStorage.getItem('cpv_demo_mode');
    if (savedDemo === 'true') {
      setIsDemo(true);
      setProfile(demoProfile);
      setIsLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setIsLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setProfile(null);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (userId: string) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    setProfile(data);
    setIsLoading(false);
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    return { error: error?.message ?? null };
  };

  const signOut = async () => {
    if (isDemo) {
      localStorage.removeItem('cpv_demo_mode');
      setIsDemo(false);
      setProfile(null);
    } else {
      await supabase.auth.signOut();
    }
  };

  const enterDemoMode = () => {
    localStorage.setItem('cpv_demo_mode', 'true');
    setIsDemo(true);
    setProfile(demoProfile);
    setIsLoading(false);
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (isDemo) {
      setProfile(prev => prev ? { ...prev, ...updates } : null);
      return;
    }
    if (!user) return;
    const { data } = await supabase.from('profiles').upsert({ id: user.id, ...updates }).select().maybeSingle();
    if (data) setProfile(data);
  };

  const showToast = useCallback((message: string, type: Toast['type'] = 'success') => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  }, []);

  return (
    <AppContext.Provider value={{
      user,
      profile,
      isDemo,
      isLoading,
      activeTab,
      setActiveTab,
      toasts,
      showToast,
      signIn,
      signUp,
      signOut,
      enterDemoMode,
      updateProfile,
      demoData: {
        measurements: demoMeasurements,
        checkin: demoDailyCheckin,
        journalEntries: demoJournalEntries,
        activities: demoActivities,
        workShifts: demoWorkShifts,
        medications: demoMedications,
        appointments: demoAppointments,
        habits: demoHabits,
        habitLogs: demoHabitLogs,
        goals: demoPersonalGoals,
        hungerEntries: demoHungerEntries,
        favoriteMeals: demoFavoriteMeals,
        shoppingList: demoShoppingList,
        shoppingItems: demoShoppingItems,
      },
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

export const DEMO_USER_ID_EXPORT = DEMO_USER_ID;
