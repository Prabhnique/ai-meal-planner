import { describe, expect, it } from "vitest";
import { validatePlannerInput } from "../src/lib/validatePlannerInput";
import { deriveSlotTargets, deriveSlots } from "../src/lib/slotHelpers";
import { filterMealsByDiet, filterMealsForSlot } from "../src/lib/filterCandidates";
import { selectMealsForSlots } from "../src/lib/selectMeals";
import { buildMealPlan } from "../src/lib/buildPlan";
import { Meal, PlannerInput } from "../src/types/planner";
import meals from "../data/meals.json";

const testMeals = meals as Meal[];

describe("validatePlannerInput", () => {
  it("accepts valid input", () => {
    const input: PlannerInput = {
      goal: "maintenance",
      calorieTarget: 2000,
      dietType: "balanced",
      mealsPerDay: 3,
    };

    const result = validatePlannerInput(input);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("rejects invalid calorie target", () => {
    const input: PlannerInput = {
      goal: "maintenance",
      calorieTarget: 900,
      dietType: "balanced",
      mealsPerDay: 3,
    };

    const result = validatePlannerInput(input);
    expect(result.isValid).toBe(false);
    expect(result.errors[0]).toContain("Calorie target");
  });
});

describe("slotHelpers", () => {
  it("derives slots for 4 meals", () => {
    expect(deriveSlots(4)).toEqual(["breakfast", "lunch", "dinner", "snack"]);
  });

  it("derives calorie targets for 3 meals", () => {
    expect(deriveSlotTargets(3, 2000)).toEqual([
      { slotName: "breakfast", slotTargetCalories: 600 },
      { slotName: "lunch", slotTargetCalories: 700 },
      { slotName: "dinner", slotTargetCalories: 700 },
    ]);
  });
});

describe("filterCandidates", () => {
  it("filters meals by diet", () => {
    const vegetarianMeals = filterMealsByDiet(testMeals, "vegetarian");
    expect(vegetarianMeals.every((meal) => meal.diet_tags.includes("vegetarian"))).toBe(true);
  });

  it("filters meals for slot", () => {
    const breakfastMeals = filterMealsForSlot(testMeals, "breakfast");
    expect(breakfastMeals.every((meal) => meal.meal_types.includes("breakfast"))).toBe(true);
  });
});

describe("selectMealsForSlots", () => {
  it("selects one meal per slot", () => {
    const slotTargets = deriveSlotTargets(3, 1800);
    const result = selectMealsForSlots(testMeals, slotTargets, "maintenance");

    expect(result.selectedMeals.length).toBeGreaterThan(0);
    expect(result.selectedMeals.length).toBeLessThanOrEqual(3);
  });
});

describe("buildMealPlan", () => {
  it("returns a structured plan", () => {
    const input: PlannerInput = {
      goal: "maintenance",
      calorieTarget: 1800,
      dietType: "balanced",
      mealsPerDay: 3,
    };

    const plan = buildMealPlan(input, testMeals);

    expect(plan.inputs).toEqual(input);
    expect(plan.slots.length).toBeGreaterThan(0);
    expect(plan.totals.calories).toBeGreaterThan(0);
    expect(typeof plan.withinTolerance).toBe("boolean");
    expect(Array.isArray(plan.fallbackReasons)).toBe(true);
  });

  it("flags outside_tolerance when needed", () => {
    const input: PlannerInput = {
      goal: "maintenance",
      calorieTarget: 4500,
      dietType: "balanced",
      mealsPerDay: 3,
    };

    const plan = buildMealPlan(input, testMeals);

    expect(plan.withinTolerance).toBe(false);
    expect(plan.fallbackReasons).toContain("outside_tolerance");
  });
});