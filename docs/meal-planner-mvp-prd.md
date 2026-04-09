## AI Meal Planner MVP PRD

## Problem Statement
Users who want a simple nutrition-planning tool often face apps that are overly complex, non-transparent, or dependent on live services. This project needs a lightweight MVP that can generate a clear 1-day meal plan from a local dataset using a small set of user inputs, while keeping the recommendation logic deterministic and the explanation grounded in known meal data.

## Target User
A user who wants a quick, structured 1-day meal plan based on a fitness goal, calorie target, diet type, and preferred number of meals per day, without creating an account or using a full nutrition-tracking platform.

## Product Promise
Generate a simple, deterministic, and explainable 1-day meal plan from a processed local dataset based on a user’s goal, calorie target, diet type, and meal count.

## Supported Inputs
- Goal: `weight loss`, `maintenance`, `muscle gain`
- Calorie target: numeric value from `1200` to `4500`
- Diet type: `vegetarian`, `high-protein`, `balanced`
- Meals per day: `3`, `4`, or `5`

## Supported Outputs
- A complete 1-day meal plan with named slots based on meal count
- Selected meal for each slot
- Calories per meal
- Protein, carbs, and fat per meal
- Total daily calories
- Total daily protein, carbs, and fat
- A short explanation grounded in the selected meal data
- Fallback messaging when the closest available plan is returned

## Product Scope
- Single-page web app built in Next.js
- Server-side meal-plan generation using reusable TypeScript modules
- Processed local dataset as the only runtime data source
- Deterministic planner output for the same inputs
- AI explanation layer with deterministic fallback explanation
- One-day meal plans only

## Out of Scope
- Login or signup
- Saved plans, user history, or profiles
- Live nutrition APIs
- Medical advice, diagnosis, or allergy-safe planning
- Grocery delivery
- Advanced dashboards
- Image generation
- Mobile app
- Combined diet modes such as `vegetarian + high-protein`

## System Architecture
- `UI layer`: collects inputs, submits generation request, renders plan, totals, explanation, and any fallback state
- `Server route/server action`: validates inputs, calls planner, calls explanation module, returns final response
- `Planner engine`: deterministic TypeScript module that filters, scores, selects, and adjusts meals
- `Explanation module`: isolated service wrapper that generates AI explanation or template-based fallback
- `Processed dataset`: local structured JSON generated from a raw CSV through ETL and validation

## Data Flow
1. User opens the single-page app and submits goal, calorie target, diet type, and meals per day.
2. Server validates supported values and calorie range.
3. Server loads the processed local dataset.
4. Planner derives meal slots and slot calorie targets.
5. Planner filters meals by diet tag and slot compatibility.
6. Planner ranks candidates deterministically, selects unique meals, and performs a bounded adjustment pass.
7. Planner returns a structured meal-plan object with slots, meals, totals, tolerance result, and fallback flags.
8. Explanation module consumes the structured plan and returns either an AI explanation or deterministic fallback text.
9. UI renders the final plan, totals, explanation, and any fallback message.

## Planner Logic Summary
- Selection unit is prebuilt meals, not raw food combinations.
- Supported slots:
  - `3 meals`: breakfast, lunch, dinner
  - `4 meals`: breakfast, lunch, dinner, snack
  - `5 meals`: breakfast, morning snack, lunch, afternoon snack, dinner
- Calorie distribution:
  - `3 meals`: 30% / 35% / 35%
  - `4 meals`: 25% / 30% / 30% / 15%
  - `5 meals`: 20% / 10% / 30% / 10% / 30%
- Runtime uses processed `diet_tags` and `meal_types`; classification is not recomputed at runtime.
- Scoring uses lexicographic priority:
  1. `slotFitScore` = absolute difference from slot calorie target
  2. goal-based bonus
  3. duplicate avoidance
  4. deterministic tie-breaks
- Goal-based ranking:
  - `weight loss`: calorie fit, satiety score, protein
  - `maintenance`: calorie fit, light protein bonus
  - `muscle gain`: calorie fit, protein, calorie density
- Duplicate meals are hard-excluded during normal selection and only allowed in fallback mode.
- Final adjustment is limited to same-slot single-meal swaps with at most 1-2 iterations.
- Daily target is considered satisfied when total calories are within `+/- 100` of the target.

## Fallback Behavior
Fallbacks should degrade gracefully without pretending constraints were fully satisfied.

Fallback order:
1. Keep dietary restriction fixed
2. Keep meal count fixed
3. Allow duplicate meals if necessary
4. Return the closest possible calorie fit outside tolerance
5. Show a clear fallback message

Standard fallback reasons:
- `duplicate_allowed`
- `outside_tolerance`
- `limited_slot_options`
- `limited_diet_options`
- `explanation_ai_unavailable`

If the final plan is outside tolerance, the UI must:
- label it as the closest available plan
- show actual total calories
- show calorie delta from target
- keep `withinTolerance` set to `false`

If AI explanation fails, the app must still return the meal plan and generate a deterministic template-based explanation.

## Planner Output Contract
The planner engine returns a structured object with:
- `inputs`: goal, calorieTarget, dietType, mealsPerDay
- `slots`: array of slot objects containing slot name, slot calorie target, and selected meal
- `meal`: id, name, calories, protein_g, carbs_g, fat_g, diet_tags, meal_types, satiety_score, description
- `totals`: calories, protein_g, carbs_g, fat_g
- `calorieDelta`
- `withinTolerance`
- `usedFallback`
- `fallbackReasons`
- optional `explanation` and `explanationSource` after explanation generation

## Acceptance Criteria
1. A valid input returns a complete 1-day meal plan with the requested number of slots.
2. Every selected meal matches the chosen diet type and slot compatibility.
3. No duplicate meals appear in the same day unless fallback is triggered.
4. Per-meal calories and macros are shown correctly.
5. Daily total calories and macros are calculated correctly.
6. `withinTolerance` is `true` when the final calorie total is within `+/- 100` of the target.
7. If constraints cannot be fully satisfied, fallback flags are set and a friendly fallback message is shown.
8. The planner still returns a usable meal plan if the AI explanation fails.
9. The explanation is grounded in selected meal facts, and template fallback explanation works when AI is unavailable.

## Implementation Order
1. Prepare and validate the processed meal dataset.
2. Define TypeScript schemas and planner output types.
3. Implement deterministic planner logic with unit tests.
4. Add fallback handling and output contract tests.
5. Wire the planner into a Next.js server route or server action.
6. Build the single-page UI for input and result display.
7. Add the AI explanation wrapper and deterministic template fallback.
8. Polish loading, validation, and error states.

## Risks And Assumptions
### Risks
- Dataset quality is the highest implementation risk.
- Thin or inconsistently tagged meal coverage will lead to frequent fallbacks or low-quality plans.
- Planner edge cases may surface around slot coverage and closest-fit adjustment.
- AI explanation reliability must be constrained to avoid unsupported claims.

### Assumptions
- The raw source is a local CSV of prebuilt meals.
- ETL will produce a processed JSON dataset used at runtime.
- Processed meals may have multiple `meal_types` and multiple `diet_tags`.
- `high-protein` tagging is assigned during ETL using a `>= 20g protein` rule.
- `satiety_score` is rule-derived during ETL and stored as an integer from `1-5`.
- Dataset validation includes required fields, numeric non-negative macros, valid tags, unique ids, non-empty descriptions, and a calorie-to-macro consistency check within 15%.
- The app remains stateless for end users, with only lightweight server logging for debugging.

## User Stories
1. As a user, I want to select a fitness goal, so that the meal plan aligns with my objective.
2. As a user, I want to enter a calorie target, so that the plan aims for my daily energy goal.
3. As a user, I want to choose a supported diet type, so that meals match my preferred eating mode.
4. As a user, I want to choose 3, 4, or 5 meals per day, so that the plan matches my preferred schedule.
5. As a user, I want the app to reject unsupported or invalid input clearly, so that I know what the system can and cannot handle.
6. As a user, I want the generated plan to include named meal slots, so that the output feels structured and easy to follow.
7. As a user, I want to see the meal chosen for each slot, so that I understand the full day plan.
8. As a user, I want to see calories and macros for each meal, so that the plan feels transparent.
9. As a user, I want to see daily totals, so that I can compare the plan with my target.
10. As a user, I want the plan to avoid duplicate meals when possible, so that the results feel realistic.
11. As a user, I want the planner to behave consistently for the same inputs, so that I can trust and debug the results.
12. As a user, I want a short explanation of why the plan fits my goal and diet type, so that the result feels understandable.
13. As a user, I want the explanation to stay grounded in the selected meal data, so that it does not make misleading claims.
14. As a user, I want the app to still return a plan if the AI explanation step fails, so that explanation generation is not a single point of failure.
15. As a user, I want the app to clearly label closest-match results when it cannot fully satisfy my target, so that I am not misled.
16. As a developer, I want the planner and explainer separated, so that the core logic is testable in isolation.
17. As a developer, I want the planner output contract to be explicit, so that the UI and explanation layer can depend on a stable interface.
18. As a developer, I want dataset validation before planner work, so that data issues are caught early.
19. As a developer, I want preflight coverage checks and runtime fallback detection, so that failures are easier to explain and test.
20. As a developer, I want the runtime system to rely on processed tags rather than recomputing classifications, so that there is one source of truth.
