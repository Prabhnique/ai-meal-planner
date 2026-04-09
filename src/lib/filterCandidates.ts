import { DietTag, FallbackReason, Meal } from "../types/planner";
import { SlotTarget } from "./slotHelpers";

export interface PreflightResult {
  filteredMeals: Meal[];
  fallbackReasons: FallbackReason[];
}

function normalizeSlotName(slotName: string): string {
  if (slotName === "morning_snack" || slotName === "afternoon_snack") {
    return "snack";
  }
  return slotName;
}

export function filterMealsByDiet(meals: Meal[], dietType: DietTag): Meal[] {
  return meals.filter((meal) => meal.diet_tags.includes(dietType));
}

export function filterMealsForSlot(meals: Meal[], slotName: string): Meal[] {
  const normalizedSlot = normalizeSlotName(slotName);
  return meals.filter((meal) => meal.meal_types.includes(normalizedSlot as Meal["meal_types"][number]));
}

export function runPreflightChecks(
  meals: Meal[],
  dietType: DietTag,
  slotTargets: SlotTarget[]
): PreflightResult {
  const fallbackReasons: FallbackReason[] = [];

  const filteredMeals = filterMealsByDiet(meals, dietType);

  const uniqueRequiredSlots = [...new Set(slotTargets.map((slot) => normalizeSlotName(slot.slotName)))];

  if (filteredMeals.length === 0) {
    fallbackReasons.push("limited_diet_options");
  }

  const hasUsableCoverage = uniqueRequiredSlots.every((slotName) => {
    const slotMeals = filterMealsForSlot(filteredMeals, slotName);
    return slotMeals.length > 0;
  });

  if (!hasUsableCoverage) {
    if (!fallbackReasons.includes("limited_diet_options")) {
      fallbackReasons.push("limited_diet_options");
    }
    fallbackReasons.push("limited_slot_options");
  }

  return {
    filteredMeals,
    fallbackReasons,
  };
}