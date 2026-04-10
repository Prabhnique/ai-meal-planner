import { describe, expect, it } from "vitest";
import meals from "../data/meals.json";
import { buildMealPlan } from "../src/lib/buildPlan";
import { Meal, PlannerInput } from "../src/types/planner";

const testMeals = meals as Meal[];

describe("planner integration with processed dataset", () => {
  it("builds a complete 3-meal balanced plan from the real dataset", () => {
    const input: PlannerInput = {
      goal: "maintenance",
      calorieTarget: 1800,
      dietType: "balanced",
      mealsPerDay: 3,
    };

    const plan = buildMealPlan(input, testMeals);

    expect(plan.inputs).toEqual(input);
    expect(plan.slots.length).toBeGreaterThan(0);
    expect(plan.slots.length).toBeLessThanOrEqual(3);

    for (const slot of plan.slots) {
      expect(slot.meal.diet_tags).toContain("balanced");
      expect(slot.meal.calories).toBeGreaterThan(0);
      expect(slot.meal.protein_g).toBeGreaterThanOrEqual(0);
      expect(slot.meal.carbs_g).toBeGreaterThanOrEqual(0);
      expect(slot.meal.fat_g).toBeGreaterThanOrEqual(0);
    }

    expect(plan.totals.calories).toBeGreaterThan(0);
    expect(typeof plan.withinTolerance).toBe("boolean");
    expect(Array.isArray(plan.fallbackReasons)).toBe(true);
  });

  it("returns fallback info when the dataset cannot satisfy the request cleanly", () => {
    const input: PlannerInput = {
      goal: "muscle_gain",
      calorieTarget: 4200,
      dietType: "high-protein",
      mealsPerDay: 5,
    };

    const plan = buildMealPlan(input, testMeals);

    expect(plan.usedFallback).toBe(true);
    expect(plan.fallbackReasons.length).toBeGreaterThan(0);
  });
});