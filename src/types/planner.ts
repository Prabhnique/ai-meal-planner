export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

export type DietTag = "vegetarian" | "high-protein" | "balanced";

export type Goal = "weight_loss" | "maintenance" | "muscle_gain";

export type MealsPerDay = 3 | 4 | 5;

export type FallbackReason =
  | "duplicate_allowed"
  | "outside_tolerance"
  | "limited_slot_options"
  | "limited_diet_options"
  | "explanation_ai_unavailable";

export interface Meal {
  id: string;
  name: string;
  meal_types: MealType[];
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  diet_tags: DietTag[];
  satiety_score: number;
  description: string;
}

export interface PlannerInput {
  goal: Goal;
  calorieTarget: number;
  dietType: DietTag;
  mealsPerDay: MealsPerDay;
}

export interface PlannerSlot {
  slotName: string;
  slotTargetCalories: number;
  meal: Meal;
}

export interface NutritionTotals {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

export interface PlannerOutput {
  inputs: PlannerInput;
  slots: PlannerSlot[];
  totals: NutritionTotals;
  calorieDelta: number;
  withinTolerance: boolean;
  usedFallback: boolean;
  fallbackReasons: FallbackReason[];
  explanation?: string;
  explanationSource?: "ai" | "template";
}