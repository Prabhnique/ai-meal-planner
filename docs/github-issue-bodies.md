## GitHub Issue Bodies

### Issue 1: Create the processed meal dataset

## What to build
Create the initial processed meal dataset for the AI Meal Planner MVP using prebuilt meals from the local raw source. The processed dataset should contain the fields required by the planner at runtime: `id`, `name`, `meal_types`, `calories`, `protein_g`, `carbs_g`, `fat_g`, `diet_tags`, `satiety_score`, and `description`.

Keep the dataset large enough to support the MVP meal slots and diet modes:
- 10-12 breakfast-capable meals
- 10-12 lunch-capable meals
- 10-12 dinner-capable meals
- 8-10 snack-capable meals

## Acceptance criteria
- [ ] A processed dataset file exists for runtime use
- [ ] Every meal includes all required fields
- [ ] Meals cover breakfast, lunch, dinner, and snack slots
- [ ] Meals include vegetarian, high-protein, and balanced coverage

## Notes
This issue focuses only on producing the processed dataset, not on automated validation yet.

---

### Issue 2: Add dataset validation script and checks

## What to build
Build a validation step for the processed dataset so data quality problems are caught before planner development. Validate required fields, numeric macros, unique ids, valid tags, non-empty descriptions, and calorie-to-macro consistency.

Add a usable coverage check so the dataset can be evaluated for whether it supports the required slot and diet combinations for the MVP.

## Acceptance criteria
- [ ] Validation can be run locally against the processed dataset
- [ ] Invalid meal records are flagged with clear error messages
- [ ] Validation checks calorie consistency within 15 percent tolerance
- [ ] Validation confirms enough usable coverage across slots and diet types

## Blocked by
- Issue 1

---

### Issue 3: Add meal and planner TypeScript types

## What to build
Define the core TypeScript contracts used across the project. Include meal record types, supported user input types, slot definitions, totals, fallback reasons, and the planner output object.

These types should be reusable by planner logic, server code, and UI code.

## Acceptance criteria
- [ ] Type definitions exist for meal records and planner output
- [ ] Supported inputs and fallback reasons are modeled explicitly
- [ ] Planner output includes inputs, slots, totals, tolerance state, and fallback flags
- [ ] Types are reusable by server and UI code

## Blocked by
- None - can start immediately

---

### Issue 4: Implement input validation for planner requests

## What to build
Add request validation for supported user inputs before meal-plan generation runs. Validate calorie target range, supported goal values, supported diet types, and allowed meal counts.

Return clear validation errors for unsupported or invalid values.

## Acceptance criteria
- [ ] Invalid calorie values outside 1200-4500 are rejected
- [ ] Unsupported goal, diet, or meal-count values are rejected
- [ ] Validation returns clear error messages
- [ ] Valid requests produce normalized planner input data

## Blocked by
- Issue 3

---

### Issue 5: Build slot derivation and calorie target helpers

## What to build
Implement reusable planner helpers that derive the correct meal slots and slot calorie targets from the selected meal count and calorie target.

Use the agreed meal-slot mappings and calorie distribution percentages from the PRD.

## Acceptance criteria
- [ ] 3-meal plans map to breakfast, lunch, dinner
- [ ] 4-meal plans map to breakfast, lunch, dinner, snack
- [ ] 5-meal plans map to breakfast, morning snack, lunch, afternoon snack, dinner
- [ ] Slot calorie targets use the agreed percentage splits

## Blocked by
- Issue 3

---

### Issue 6: Build candidate filtering and preflight coverage checks

## What to build
Implement planner logic that filters meals by selected diet type and slot compatibility, then performs preflight checks to detect limited diet coverage or limited slot coverage before selection starts.

Use the processed dataset as the single source of truth for `diet_tags` and `meal_types`.

## Acceptance criteria
- [ ] Filtering uses processed `diet_tags` and `meal_types`
- [ ] Preflight detects insufficient usable diet coverage
- [ ] Preflight detects insufficient slot coverage
- [ ] Fallback reasons can be recorded from preflight results

## Blocked by
- Issue 2
- Issue 3
- Issue 5

---

### Issue 7: Implement deterministic meal scoring and initial selection

## What to build
Build the core planner selection flow. Rank meals using slot calorie fit, goal-specific bias, duplicate avoidance, and deterministic tie-break rules. Select unique meals slot by slot.

The planner should be deterministic for the same inputs.

## Acceptance criteria
- [ ] `slotFitScore` uses absolute calorie difference from slot target
- [ ] Goal scoring follows the agreed priority rules for weight loss, maintenance, and muscle gain
- [ ] Duplicate meals are excluded during normal selection
- [ ] Same inputs produce the same plan output

## Blocked by
- Issue 3
- Issue 5
- Issue 6

---

### Issue 8: Add adjustment pass and fallback handling

## What to build
Add the bounded adjustment pass that swaps meals within the same slot to improve total calorie fit. Implement fallback behavior for duplicates, limited options, and closest-match plans outside tolerance.

Populate planner output fields related to tolerance and fallback state.

## Acceptance criteria
- [ ] Adjustment is limited to same-slot swaps with at most 1-2 iterations
- [ ] Duplicate meals are only allowed after fallback is triggered
- [ ] `withinTolerance` is set correctly based on +/- 100 calories
- [ ] `usedFallback` and `fallbackReasons` are populated correctly

## Blocked by
- Issue 7

---

### Issue 9: Add planner unit tests

## What to build
Create unit tests for planner behavior, covering slot generation, filtering, scoring, duplicate handling, tolerance checks, and fallback cases.

Focus on external planner behavior rather than internal implementation details.

## Acceptance criteria
- [ ] Tests cover valid generation for 3, 4, and 5 meal plans
- [ ] Tests verify diet and slot compatibility of selected meals
- [ ] Tests verify duplicate prevention and fallback duplicate behavior
- [ ] Tests verify tolerance and outside-tolerance handling

## Blocked by
- Issue 8

---

### Issue 10: Add planner integration test with processed dataset

## What to build
Create integration-style tests that run the planner against the processed dataset using realistic user inputs. Verify the final output shape and behavior end to end without the UI.

This should confirm that the planner works correctly with real processed meal data.

## Acceptance criteria
- [ ] Tests run planner against the actual processed dataset
- [ ] Output matches the expected planner contract
- [ ] Totals and slot assignments are correct
- [ ] Fallback cases are covered with realistic dataset conditions

## Blocked by
- Issue 2
- Issue 8

---

### Issue 11: Expose meal-plan generation through a Next.js server endpoint

## What to build
Wire the validated planner into a Next.js route handler or server action. The server layer should validate input, load the processed dataset, call the planner, and return structured results.

Keep planner execution on the server only.

## Acceptance criteria
- [ ] Server endpoint accepts the supported input fields
- [ ] Invalid requests return clear validation errors
- [ ] Valid requests return the structured planner output
- [ ] Planner logic runs only on the server

## Blocked by
- Issue 4
- Issue 8

---

### Issue 12: Build the single-page meal planner form

## What to build
Create the MVP UI for collecting goal, calorie target, diet type, and meals per day. Submit the form to the server and render validation feedback.

Keep the form simple and aligned with the supported input contract only.

## Acceptance criteria
- [ ] Form includes all supported inputs
- [ ] Generate button is disabled during loading
- [ ] Invalid inputs show clear inline errors
- [ ] Unsupported requests show the defined product limitation message

## Blocked by
- Issue 11

---

### Issue 13: Render meal-plan results and fallback messaging

## What to build
Build the result view for displaying meal slots, selected meals, per-meal macros, daily totals, and any closest-match or fallback messaging returned by the planner.

This should make both successful and degraded plan states understandable.

## Acceptance criteria
- [ ] Each slot shows meal name, calories, protein, carbs, and fat
- [ ] Daily totals are displayed clearly
- [ ] Closest available plans are labeled when outside tolerance
- [ ] Fallback message appears when fallback reasons are present

## Blocked by
- Issue 11
- Issue 12

---

### Issue 14: Add deterministic explanation fallback generator

## What to build
Implement the template-based explanation generator that turns planner results into a short, fact-grounded explanation when AI is unavailable.

The generated explanation should stay neutral, concise, and based only on the plan facts.

## Acceptance criteria
- [ ] Fallback explanation uses only plan facts and totals
- [ ] Explanation is short, neutral, and specific
- [ ] Explanation references goal, calorie alignment, and diet fit
- [ ] Fallback explanation works without any AI dependency

## Blocked by
- Issue 8

---

### Issue 15: Add AI explanation service wrapper

## What to build
Build the isolated AI explanation module that consumes the planner output and returns a short explanation. Keep the prompt limited to approved user-facing structured facts only.

The AI layer must not influence meal selection.

## Acceptance criteria
- [ ] AI prompt includes only approved planner facts
- [ ] AI explanation does not influence meal selection
- [ ] AI output is short, plain-English, and fact-grounded
- [ ] If the AI step fails, the system can fall back to the deterministic explanation

## Blocked by
- Issue 14

---

### Issue 16: Connect explanation flow to the server response

## What to build
Update the server generation flow so it attaches either the AI explanation or the fallback explanation to the final response returned to the UI.

Include explanation source metadata and fallback reason updates where needed.

## Acceptance criteria
- [ ] Successful requests include explanation text in the response
- [ ] Response includes explanation source metadata
- [ ] AI failure still returns a complete meal plan
- [ ] `explanation_ai_unavailable` is recorded when fallback explanation is used

## Blocked by
- Issue 11
- Issue 14
- Issue 15

---

### Issue 17: Add end-to-end integration tests for server and explanation flow

## What to build
Add integration tests covering the full generation flow from validated request to final server response, including planner output and explanation fallback behavior.

These tests should verify the contract used by the UI.

## Acceptance criteria
- [ ] Tests cover valid end-to-end generation through the server layer
- [ ] Tests cover AI explanation success or mocked success
- [ ] Tests cover AI failure with deterministic fallback explanation
- [ ] Tests verify final response contract used by the UI

## Blocked by
- Issue 16

---

### Issue 18: Polish loading, error, and empty states

## What to build
Refine the user experience around loading, server errors, fallback explanations, and closest-match plans so the MVP feels complete and understandable.

This includes both messaging quality and basic responsiveness.

## Acceptance criteria
- [ ] Loading state clearly communicates generation progress
- [ ] Unexpected server errors show a friendly message
- [ ] Closest-match and fallback states are understandable in the UI
- [ ] The app remains usable and readable on desktop and mobile

## Blocked by
- Issue 13
- Issue 16
- Issue 17
