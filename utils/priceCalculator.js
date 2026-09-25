/**
 * Pricing system.
 *
 * The active system is grade-based: a customer's condition answers are reduced to a
 * single letter grade (A = best condition … F = worst), and that grade is looked up
 * directly in the product's own gradePricing table for an exact dollar amount — no
 * percentage math involved.
 *
 * The old percentage-deduction system (calculatePrice below) is kept only as a
 * fallback for products that don't have gradePricing configured yet, so nothing that
 * currently works stops working mid-migration.
 */

export const GRADES = ['A', 'B', 'C', 'D', 'E', 'F'];

// Customer-facing labels for each grade — shown wherever a raw letter would be
// confusing on its own (admin tables, condition summaries, etc.)
export const GRADE_LABELS = {
  A: 'Excellent — Like New',
  B: 'Good',
  C: 'Fair',
  D: 'Worn',
  E: 'Poor',
  F: 'Heavily Damaged',
};

/**
 * Reduce a set of condition answers to a single letter grade, generically for any
 * category's question set.
 *
 * Each question's options array is treated as already ordered best -> worst (this is
 * how every category's assessmentQuestions are authored, e.g. screen: perfect,
 * scratched, cracked), so an option's index within its question IS its severity —
 * no separate severity field needed. We sum the chosen severities across every
 * question, normalize against the worst possible total, and bucket that ratio into
 * 6 equal bands (A..F).
 *
 * @param {Object} conditionAnswers - map of questionKey -> chosen optionKey
 * @param {Array} assessmentQuestions - the category's Category.assessmentQuestions
 * @returns {String} one of GRADES
 */
export const computeGrade = (conditionAnswers, assessmentQuestions) => {
  if (!assessmentQuestions || !assessmentQuestions.length) return 'C'; // no config — neutral fallback

  let totalSeverity = 0;
  let maxSeverity = 0;

  for (const question of assessmentQuestions) {
    const options = question.options || [];
    if (!options.length) continue;

    const worstIndex = options.length - 1;
    maxSeverity += worstIndex;

    const chosenKey = conditionAnswers ? conditionAnswers[question.key] : undefined;
    const chosenIndex = options.findIndex((o) => o.key === chosenKey);
    // Unanswered/unrecognized question -> treat as worst case for that question
    // (defensive: never lets a missing answer accidentally inflate the grade).
    totalSeverity += chosenIndex >= 0 ? chosenIndex : worstIndex;
  }

  if (maxSeverity === 0) return 'A';

  const ratio = totalSeverity / maxSeverity; // 0 (perfect) .. 1 (worst)
  const gradeIndex = Math.min(GRADES.length - 1, Math.floor(ratio * GRADES.length));
  return GRADES[gradeIndex];
};

/**
 * Look up the exact grade-based price for a product.
 *
 * @param {Object} mobile - the Mobile document (needs .gradePricing)
 * @param {String} storage - chosen storage key (e.g. "256GB"), or falsy for
 *   categories with no storage step
 * @param {Boolean} isLocked - true if the device is carrier-locked
 * @param {String} grade - one of GRADES
 * @returns {Number|null} the price, or null if not configured (caller should fall
 *   back to calculatePrice in that case)
 */
export const calculateGradePrice = (mobile, storage, isLocked, grade) => {
  const table = mobile && mobile.gradePricing;
  if (!table || typeof table !== 'object') return null;

  const storageKey = storage || 'default';
  const bucket = table[storageKey] || table.default;
  if (!bucket) return null;

  const tier = isLocked ? bucket.locked : bucket.unlocked;
  if (!tier) return null;

  const price = tier[grade];
  return typeof price === 'number' && !Number.isNaN(price) ? price : null;
};

/**
 * LEGACY percentage-deduction pricing — fallback only, see file header.
 *
 * `conditions` is a map of questionKey -> chosen optionKey (e.g.
 * { screen: 'cracked', body: 'perfect' }) and `rules` is the matching map of
 * questionKey -> { optionKey: percentDeduction }.
 */
const defaultRules = {
  screen: { perfect: 0, scratched: 10, cracked: 25 },
  body: { perfect: 0, scratched: 10, damaged: 20 },
  battery: { good: 0, average: 10, poor: 20 }
};

export const calculatePrice = (basePrice, conditions, rules) => {
  if (!basePrice || !conditions) return 0;

  const useRules = rules || defaultRules;

  let totalDeductionPercent = 0;

  for (const key of Object.keys(conditions)) {
    const chosenOption = conditions[key];
    if (chosenOption && useRules[key] && useRules[key][chosenOption] !== undefined) {
      totalDeductionPercent += useRules[key][chosenOption];
    }
  }

  // max limit (optional safety)
  if (totalDeductionPercent > 80) {
    totalDeductionPercent = 80;
  }

  const finalPrice =
    basePrice - (basePrice * totalDeductionPercent) / 100;

  return Math.round(finalPrice < 0 ? 0 : finalPrice);
};
