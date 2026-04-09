import { DietTag, Goal, MealsPerDay, PlannerInput } from "../types/planner";

const VALID_GOALS: Goal[] = ["weight_loss", "maintenance", "muscle_gain"];
const VALID_DIET_TAGS: DietTag[] = ["vegetarian", "high-protein", "balanced"];
const VALID_MEALS_PER_DAY: MealsPerDay[] = [3, 4, 5];

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validatePlannerInput(input: PlannerInput): ValidationResult {
  const errors: string[] = [];

  if (!VALID_GOALS.includes(input.goal)) {
    errors.push("Invalid goal.");
  }

  if (
    typeof input.calorieTarget !== "number" ||
    !Number.isFinite(input.calorieTarget) ||
    input.calorieTarget < 1200 ||
    input.calorieTarget > 4500
  ) {
    errors.push("Calorie target must be a number between 1200 and 4500.");
  }

  if (!VALID_DIET_TAGS.includes(input.dietType)) {
    errors.push("Invalid diet type.");
  }

  if (!VALID_MEALS_PER_DAY.includes(input.mealsPerDay)) {
    errors.push("Meals per day must be 3, 4, or 5.");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}