const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "..", "data", "meals.json");

const VALID_MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"];
const VALID_DIET_TAGS = ["vegetarian", "high-protein", "balanced"];

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isNonNegativeNumber(value) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function validateMeal(meal, seenIds) {
  const errors = [];

  const requiredFields = [
    "id",
    "name",
    "meal_types",
    "calories",
    "protein_g",
    "carbs_g",
    "fat_g",
    "diet_tags",
    "satiety_score",
    "description",
  ];

  for (const field of requiredFields) {
    if (!(field in meal)) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  if (!isNonEmptyString(meal.id)) {
    errors.push("id must be a non-empty string");
  } else if (seenIds.has(meal.id)) {
    errors.push(`Duplicate id: ${meal.id}`);
  } else {
    seenIds.add(meal.id);
  }

  if (!isNonEmptyString(meal.name)) {
    errors.push("name must be a non-empty string");
  }

  if (!Array.isArray(meal.meal_types) || meal.meal_types.length === 0) {
    errors.push("meal_types must be a non-empty array");
  } else {
    for (const type of meal.meal_types) {
      if (!VALID_MEAL_TYPES.includes(type)) {
        errors.push(`Invalid meal_type: ${type}`);
      }
    }
  }

  if (!isNonNegativeNumber(meal.calories)) {
    errors.push("calories must be a non-negative number");
  }

  if (!isNonNegativeNumber(meal.protein_g)) {
    errors.push("protein_g must be a non-negative number");
  }

  if (!isNonNegativeNumber(meal.carbs_g)) {
    errors.push("carbs_g must be a non-negative number");
  }

  if (!isNonNegativeNumber(meal.fat_g)) {
    errors.push("fat_g must be a non-negative number");
  }

  if (!Array.isArray(meal.diet_tags) || meal.diet_tags.length === 0) {
    errors.push("diet_tags must be a non-empty array");
  } else {
    for (const tag of meal.diet_tags) {
      if (!VALID_DIET_TAGS.includes(tag)) {
        errors.push(`Invalid diet_tag: ${tag}`);
      }
    }
  }

  if (!isNonNegativeNumber(meal.satiety_score)) {
    errors.push("satiety_score must be a non-negative number");
  }

  if (!isNonEmptyString(meal.description)) {
    errors.push("description must be a non-empty string");
  }

  if (
    isNonNegativeNumber(meal.calories) &&
    isNonNegativeNumber(meal.protein_g) &&
    isNonNegativeNumber(meal.carbs_g) &&
    isNonNegativeNumber(meal.fat_g)
  ) {
    const macroCalories =
      meal.protein_g * 4 + meal.carbs_g * 4 + meal.fat_g * 9;

    if (macroCalories > 0) {
      const diffPercent = Math.abs(meal.calories - macroCalories) / macroCalories;
      if (diffPercent > 0.15) {
        errors.push(
          `Calories inconsistent with macros: declared=${meal.calories}, computed=${macroCalories.toFixed(
            1
          )}`
        );
      }
    }
  }

  return errors;
}

function validateCoverage(meals) {
  const warnings = [];

  const countsByType = {
    breakfast: 0,
    lunch: 0,
    dinner: 0,
    snack: 0,
  };

  for (const meal of meals) {
    for (const type of meal.meal_types || []) {
      if (countsByType[type] !== undefined) {
        countsByType[type] += 1;
      }
    }
  }

  for (const [type, count] of Object.entries(countsByType)) {
    if (count === 0) {
      warnings.push(`No meals found for slot: ${type}`);
    }
  }

  return warnings;
}

function main() {
  const raw = fs.readFileSync(filePath, "utf8");
  const meals = JSON.parse(raw);

  if (!Array.isArray(meals)) {
    console.error("Dataset must be an array.");
    process.exit(1);
  }

  const seenIds = new Set();
  let hasErrors = false;

  meals.forEach((meal, index) => {
    const errors = validateMeal(meal, seenIds);
    if (errors.length > 0) {
      hasErrors = true;
      console.error(`\nMeal ${index + 1} (${meal.name || "Unnamed"}):`);
      errors.forEach((err) => console.error(`- ${err}`));
    }
  });

  const warnings = validateCoverage(meals);
  if (warnings.length > 0) {
    console.warn("\nCoverage warnings:");
    warnings.forEach((warning) => console.warn(`- ${warning}`));
  }

  if (hasErrors) {
    console.error("\nValidation failed.");
    process.exit(1);
  }

  console.log("Validation passed.");
}

main();