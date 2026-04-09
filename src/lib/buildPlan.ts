import {
  FallbackReason,
  Goal,
  Meal,
  PlannerInput,
  PlannerOutput,
} from "../types/planner";
import { runPreflightChecks } from "./filterCandidates";
import { selectMealsForSlots } from "./selectMeals";
import { deriveSlotTargets } from "./slotHelpers";

function calculateTotals(
  selectedMeals: { slotName: string; slotTargetCalories: number; meal: Meal }[]
) {
  return selectedMeals.reduce(
    (totals, slot) => {
      totals.calories += slot.meal.calories;
      totals.protein_g += slot.meal.protein_g;
      totals.carbs_g += slot.meal.carbs_g;
      totals.fat_g += slot.meal.fat_g;
      return totals;
    },
    {
      calories: 0,
      protein_g: 0,
      carbs_g: 0,
      fat_g: 0,
    }
  );
}

function getCalorieDelta(totalCalories: number, calorieTarget: number): number {
  return totalCalories - calorieTarget;
}

function isWithinTolerance(delta: number): boolean {
  return Math.abs(delta) <= 100;
}

function trySameSlotSwap(
  currentMeal: Meal,
  slotMeals: Meal[],
  slotTargetCalories: number,
  currentTotalCalories: number,
  dailyTarget: number
): Meal {
  let bestMeal = currentMeal;
  let bestDelta = Math.abs(currentTotalCalories - dailyTarget);

  for (const candidate of slotMeals) {
    if (candidate.id === currentMeal.id) continue;

    const newTotal =
      currentTotalCalories - currentMeal.calories + candidate.calories;
    const newDelta = Math.abs(newTotal - dailyTarget);

    const currentSlotFit = Math.abs(currentMeal.calories - slotTargetCalories);
    const candidateSlotFit = Math.abs(candidate.calories - slotTargetCalories);

    const improvesDailyTotal = newDelta < bestDelta;
    const slotFitNotMuchWorse = candidateSlotFit <= currentSlotFit + 100;

    if (improvesDailyTotal && slotFitNotMuchWorse) {
      bestMeal = candidate;
      bestDelta = newDelta;
    }
  }

  return bestMeal;
}

export function buildMealPlan(
  input: PlannerInput,
  meals: Meal[]
): PlannerOutput {
  const slotTargets = deriveSlotTargets(input.mealsPerDay, input.calorieTarget);

  const preflight = runPreflightChecks(meals, input.dietType, slotTargets);
  const fallbackReasons: FallbackReason[] = [...preflight.fallbackReasons];

  const initialSelection = selectMealsForSlots(
    preflight.filteredMeals,
    slotTargets,
    input.goal as Goal
  );

  if (initialSelection.usedDuplicateFallback) {
    fallbackReasons.push("duplicate_allowed");
  }

  let selectedMeals = initialSelection.selectedMeals;

  for (let iteration = 0; iteration < 2; iteration++) {
    const currentTotals = calculateTotals(selectedMeals);

    selectedMeals = selectedMeals.map((slot) => {
      const slotMeals = preflight.filteredMeals.filter((meal) =>
        meal.meal_types.includes(
          slot.slotName === "morning_snack" || slot.slotName === "afternoon_snack"
            ? "snack"
            : (slot.slotName as "breakfast" | "lunch" | "dinner" | "snack")
        )
      );

      const swappedMeal = trySameSlotSwap(
        slot.meal,
        slotMeals,
        slot.slotTargetCalories,
        currentTotals.calories,
        input.calorieTarget
      );

      return {
        ...slot,
        meal: swappedMeal,
      };
    });
  }

  const totals = calculateTotals(selectedMeals);
  const calorieDelta = getCalorieDelta(totals.calories, input.calorieTarget);
  const withinTolerance = isWithinTolerance(calorieDelta);

  if (!withinTolerance) {
    fallbackReasons.push("outside_tolerance");
  }

  const usedFallback = fallbackReasons.length > 0;

  return {
    inputs: input,
    slots: selectedMeals.map((slot) => ({
      slotName: slot.slotName,
      slotTargetCalories: slot.slotTargetCalories,
      meal: slot.meal,
    })),
    totals,
    calorieDelta,
    withinTolerance,
    usedFallback,
    fallbackReasons: [...new Set(fallbackReasons)],
  };
}