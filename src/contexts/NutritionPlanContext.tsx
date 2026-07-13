import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { getOfficialNutritionPlan, type NutritionPlanView } from '../lib/jarvis-core';
import { supabase } from '../lib/supabase';
import { todayISO } from '../lib/utils';
import { useApp } from './AppContext';

interface NutritionPlanContextValue {
  plan: NutritionPlanView | null;
  loading: boolean;
  error: string | null;
  shiftType: string | null;
  refresh: () => Promise<void>;
}

const NutritionPlanContext = createContext<NutritionPlanContextValue | null>(null);

export function NutritionPlanProvider({ children }: { children: React.ReactNode }) {
  const { user, dataVersion } = useApp();
  const [plan, setPlan] = useState<NutritionPlanView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shiftType, setShiftType] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user) {
      setPlan(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const date = todayISO();
      const { data: shift } = await supabase
        .from('work_shifts')
        .select('shift_type,custom_label')
        .eq('user_id', user.id)
        .eq('date', date)
        .maybeSingle();
      const resolvedShift = resolvePlanShift(shift?.shift_type ?? null, shift?.custom_label ?? null);
      setShiftType(resolvedShift);
      setPlan(await getOfficialNutritionPlan(date, resolvedShift));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Piano nutrizionale non disponibile.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { void refresh(); }, [refresh, dataVersion]);

  return (
    <NutritionPlanContext.Provider value={{ plan, loading, error, shiftType, refresh }}>
      {children}
    </NutritionPlanContext.Provider>
  );
}

export function useNutritionPlan() {
  const context = useContext(NutritionPlanContext);
  if (!context) throw new Error('useNutritionPlan must be used within NutritionPlanProvider');
  return context;
}

function resolvePlanShift(shiftType: string | null, customLabel: string | null) {
  const custom = customLabel?.toLocaleLowerCase('it') ?? '';
  if (/smonto|dopo.*notte/.test(custom)) return 'off_after_night';
  if (shiftType === 'custom') return 'rest';
  return shiftType;
}
