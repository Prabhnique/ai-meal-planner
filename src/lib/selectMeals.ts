import { Goal, Meal } from "../types/planner";
import { SlotTarget } from "./slotHelpers";
import { filterMealsForSlot } from "./filterCandidates";

function getCalorieDensity(meal: Meal): number {
  const macroTotal = meal.protein_g + meal.carbs_g + meal.fat_g;
  if (macroTotal === 0) return 0;
  return meal.calories / macroTotal;
}

function getSlotFitScore(meal: Meal, slotTargetCalories: number): number {
  return Math.abs(meal.calories - slotTargetCalories);
}

function compareGoalBonus(a: Meal, b: Meal, goal: Goal): number {
  if (goal === "weight_loss") {
    if (b.satiety_score !== a.satiety_score) {
      return b.satiety_score - a.satiety_score;
    }
    if (b.protein_g !== a.protein_g) {
      return b.protein_g - a.protein_g;
    }
    return getCalorieDensity(a) - getCalorieDensity(b);
  }

  if (goal === "maintenance") {
    return b.protein_g - a.protein_g;
  }

  if (goal === "muscle_gain") {
    if (b.protein_g !== a.protein_g) {
      return b.protein_g - a.protein_g;
    }
    return getCalorieDensity(b) - getCalorieDensity(a);
  }

  return 0;
}

function compareMeals(
  a: Meal,
  b: Meal,
  slotTargetCalories: number,
  goal: Goal
): number {
  const slotFitA = getSlotFitScore(a, slotTargetCalories);
  const slotFitB = getSlotFitScore(b, slotTargetCalories);

  if (slotFitA !== slotFitB) {
    return slotFitA - slotFitB;
  }

  const goalComparison = compareGoalBonus(a, b, goal);
  if (goalComparison !== 0) {
    return goalComparison;
  }

  return a.id.localeCompare(b.id);
}

export interface SelectedSlotMeal {
  slotName: string;
  slotTargetCalories: number;
  meal: Meal;
}

export function selectMealsForSlots(
  meals: Meal[],
  slotTargets: SlotTarget[],
  goal: Goal
): {
  selectedMeals: SelectedSlotMeal[];
  usedDuplicateFallback: boolean;
} {
  const selectedMeals: SelectedSlotMeal[] = [];
  const usedMealIds = new Set<string>();
  let usedDuplicateFallback = false;

  for (const slot of slotTargets) {
    let candidates = filterMealsForSlot(meals, slot.slotName);

    const uniqueCandidates = candidates.filter(
      (meal) => !usedMealIds.has(meal.id)
    );

    let finalCandidates = uniqueCandidates;

    if (finalCandidates.length === 0) {
      finalCandidates = candidates;
      usedDuplicateFallback = true;
    }

    if (finalCandidates.length === 0) {
      continue;
    }

    finalCandidates.sort((a, b) =>
      compareMeals(a, b, slot.slotTargetCalories, goal)
    );

    const chosenMeal = finalCandidates[0];

    selectedMeals.push({
      slotName: slot.slotName,
      slotTargetCalories: slot.slotTargetCalories,
      meal: chosenMeal,
    });

    usedMealIds.add(chosenMeal.id);
  }

  return {
    selectedMeals,
    usedDuplicateFallback,
  };
}