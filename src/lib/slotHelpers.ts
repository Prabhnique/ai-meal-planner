import { MealsPerDay } from "../types/planner";

export interface SlotTarget {
  slotName: string;
  slotTargetCalories: number;
}

const SLOT_CONFIG: Record<MealsPerDay, { slotName: string; percentage: number }[]> = {
  3: [
    { slotName: "breakfast", percentage: 0.3 },
    { slotName: "lunch", percentage: 0.35 },
    { slotName: "dinner", percentage: 0.35 },
  ],
  4: [
    { slotName: "breakfast", percentage: 0.25 },
    { slotName: "lunch", percentage: 0.3 },
    { slotName: "dinner", percentage: 0.3 },
    { slotName: "snack", percentage: 0.15 },
  ],
  5: [
    { slotName: "breakfast", percentage: 0.2 },
    { slotName: "morning_snack", percentage: 0.1 },
    { slotName: "lunch", percentage: 0.3 },
    { slotName: "afternoon_snack", percentage: 0.1 },
    { slotName: "dinner", percentage: 0.3 },
  ],
};

export function deriveSlots(mealsPerDay: MealsPerDay): string[] {
  return SLOT_CONFIG[mealsPerDay].map((slot) => slot.slotName);
}

export function deriveSlotTargets(
  mealsPerDay: MealsPerDay,
  calorieTarget: number
): SlotTarget[] {
  return SLOT_CONFIG[mealsPerDay].map((slot) => ({
    slotName: slot.slotName,
    slotTargetCalories: Math.round(calorieTarget * slot.percentage),
  }));
}