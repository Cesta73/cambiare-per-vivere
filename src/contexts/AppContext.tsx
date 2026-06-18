import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type {
  ActivityEntry,
  Appointment,
  BodyMeasurement,
  DailyCheckin,
  FavoriteMeal,
  HabitDefinition,
  HabitLog,
  HungerSatietyEntry,
  JournalEntry,
  MedicationReminder,
  PersonalGoal,
  Profile,
  ShoppingList,
  ShoppingListItem,
  WorkShift,
} from '../lib/supabase';

export type AppTab = 'oggi' | 'registro' | 'settimana' | 'diario' | 'progressi' | 'altro' | 'cammino' | 'dharma';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface EmptyLegacyData {
  measurements: BodyMeasurement[];
  checkin: DailyCheckin | null;
  journalEntries: JournalEntry[];
  activities: ActivityEntry[];
  workShifts: WorkShift[];
  medications: MedicationReminder[];
  appointments: Appointment[];
  habits: HabitDefinition[];
  habitLogs: HabitLog[];
  goals: PersonalGoal[];
  hungerEntries: HungerSatietyEntry[];
  favoriteMeals: FavoriteMeal[];
  shoppingList: ShoppingList | null;
  shoppingItems: ShoppingListItem[];
}

const emptyLegacyData: EmptyLegacyData = {
  measurements: [],
  checkin: null,
  journalEntries: [],
  activities: [],
  workShifts: [],
  medications: [],
  appointments: [],
  habits: [],
  habitLogs: [],
  goals: [],
  hungerEntries: [],
  favoriteMeals: [],
  shoppingList: null,
  shoppingItems: [],
};

interface AppContextValue {
  user: User | null;
  profile: Profile | null;
  isDemo: false;
  isLoading: boolean;
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  dataVersion: number;
  refreshData: () => void;
  toasts: Toast[];
  showToast: (message: string, type?: Toast['type']) => void;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: string | null }>;
  demoData: EmptyLegacyData;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<AppTab>('oggi');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [dataVersion, setDataVersion] = useState(0);

  const loadProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    if (error) {
      setProfile(null);
      setIsLoading(false);
      return error.message;
    }
    setProfile(data);
    setIsLoading(false);
    return null;
  }, []);

  useEffect(() => {
    localStorage.removeItem('cpv_demo_mode');
    localStorage.removeItem('cpv_demo_centro_prefs');
    localStorage.removeItem('cpv_demo_study_progress');

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        void loadProfile(session.user.id);
      } else {
        setIsLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        void loadProfile(session.user.id);
      } else {
        setProfile(null);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [loadProfile]);

  useEffect(() => {
    if (!user) return;

    const tables = [
      'body_measurements',
      'daily_checkins',
      'journal_entries',
      'hunger_satiety_entries',
      'activity_entries',
      'hydration_entries',
      'sleep_entries',
      'medication_logs',
      'reminders',
      'camino_workouts',
      'contemplative_sessions',
      'jarvis_events',
    ];

    const channel = tables.reduce(
      (current, table) => current.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table,
          filter: `user_id=eq.${user.id}`,
        },
        () => setDataVersion(version => version + 1),
      ),
      supabase.channel(`personal-data-${user.id}`),
    );

    channel.subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    return { error: error?.message ?? null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { error: 'Sessione non disponibile.' };
    const { data, error } = await supabase
      .from('profiles')
      .upsert({ id: user.id, ...updates })
      .select()
      .maybeSingle();
    if (error) return { error: error.message };
    if (data) setProfile(data);
    return { error: null };
  };

  const showToast = useCallback((message: string, type: Toast['type'] = 'success') => {
    const id = crypto.randomUUID();
    setToasts(prev => [...prev, { id, message, type }]);
    window.setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  }, []);

  return (
    <AppContext.Provider value={{
      user,
      profile,
      isDemo: false,
      isLoading,
      activeTab,
      setActiveTab,
      dataVersion,
      refreshData: () => setDataVersion(version => version + 1),
      toasts,
      showToast,
      signIn,
      signOut,
      updateProfile,
      demoData: emptyLegacyData,
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
