export const DEFAULT_SEDENTARY_PAL = 1.4;

const ACTIVITY_MET: Record<string, number> = {
  walking: 4,
  aerobic: 6,
  strength: 5,
  mobility: 2.5,
  yoga: 2.8,
  daily: 3,
  other: 4,
};

export function ageOnDate(birthDate: string | null | undefined, birthYear: number | null | undefined, onDate = new Date()) {
  if (birthDate) {
    const birth = new Date(`${birthDate}T12:00:00Z`);
    if (Number.isFinite(birth.getTime())) {
      let age = onDate.getUTCFullYear() - birth.getUTCFullYear();
      const beforeBirthday = onDate.getUTCMonth() < birth.getUTCMonth() ||
        (onDate.getUTCMonth() === birth.getUTCMonth() && onDate.getUTCDate() < birth.getUTCDate());
      if (beforeBirthday) age -= 1;
      return age;
    }
  }
  return birthYear ? onDate.getFullYear() - birthYear : null;
}

export function estimateRestingEnergy(weightKg: number | null, heightCm: number | null, age: number | null, biologicalSex: string | null) {
  if (!weightKg || !heightCm || !age || !['male', 'female'].includes(biologicalSex || '')) return null;
  return Math.round(10 * weightKg + 6.25 * heightCm - 5 * age + (biologicalSex === 'male' ? 5 : -161));
}

export function estimateNetActivityCalories(activityType: string, durationMinutes: number, weightKg: number, perceivedEffort?: number | null) {
  if (!durationMinutes || !weightKg) return null;
  const effortFactor = perceivedEffort ? Math.max(0.75, Math.min(1.15, 0.7 + perceivedEffort * 0.05)) : 1;
  const adjustedMet = Math.max(1, (ACTIVITY_MET[activityType] ?? ACTIVITY_MET.other) * effortFactor);
  return Math.round((adjustedMet - 1) * weightKg * (durationMinutes / 60));
}
