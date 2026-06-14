import { useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import { supabase } from '../../lib/supabase';

export function ReminderWatcher() {
  const { user } = useApp();

  useEffect(() => {
    if (!user || !('Notification' in window) || Notification.permission !== 'granted') return;

    const checkReminders = async () => {
      const now = new Date();
      const windowStart = new Date(now.getTime() - 60000).toISOString();
      const windowEnd = new Date(now.getTime() + 60000).toISOString();
      const { data } = await supabase
        .from('reminders')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_enabled', true)
        .is('completed_at', null)
        .gte('remind_at', windowStart)
        .lte('remind_at', windowEnd);

      for (const reminder of data ?? []) {
        new Notification(reminder.title, { body: reminder.notes ?? 'Cambiare per Vivere' });
        if (reminder.repeat_rule === 'daily' || reminder.repeat_rule === 'weekly') {
          const next = new Date(reminder.remind_at);
          next.setDate(next.getDate() + (reminder.repeat_rule === 'daily' ? 1 : 7));
          await supabase.from('reminders').update({ remind_at: next.toISOString() }).eq('id', reminder.id);
        } else {
          await supabase.from('reminders').update({ completed_at: now.toISOString() }).eq('id', reminder.id);
        }
      }
    };

    void checkReminders();
    const interval = window.setInterval(() => void checkReminders(), 60000);
    return () => window.clearInterval(interval);
  }, [user]);

  return null;
}
