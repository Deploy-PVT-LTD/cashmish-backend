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

const RANK = Object.fromEntries(GRADES.map((g, i) => [g, i]));

// Returns whichever of the two grade letters is worse (higher rank). Ignores anything
// that isn't a real grade letter (defensive against bad/missing data).
const worstOf = (current, candidate) => {
  if (!candidate || !(candidate in RANK)) return current;
  return RANK[candidate] > RANK[current] ? candidate : current;
};

// Legacy severity-index grading — kept only for a category that hasn't been migrated
// to gradeRole-tagged questions yet (every option's index within its question is its
// severity; sum across questions, normalize, bucket into 6 equal bands).
const legacySeverityGrade = (conditionAnswers, assessmentQuestions) => {
  let totalSeverity = 0;
  let maxSeverity = 0;

  for (const question of assessmentQuestions) {
    const options = question.options || [];
    if (!options.length) continue;

    const worstIndex = options.length - 1;
    maxSeverity += worstIndex;

    const chosenKey = conditionAnswers ? conditionAnswers[question.key] : undefined;
    const chosenIndex = options.findIndex((o) => o.key === chosenKey);
    totalSeverity += chosenIndex >= 0 ? chosenIndex : worstIndex;
  }

  if (maxSeverity === 0) return 'A';
  const ratio = totalSeverity / maxSeverity;
  return GRADES[Math.min(GRADES.length - 1, Math.floor(ratio * GRADES.length))];
};

/**
 * Reduce a set of condition answers to a single letter grade, generically for any
 * category's question set, using each question's `gradeRole` (see categoryModel.js):
 *
 *  - 'cosmetic': the answer key IS a grade letter — worst-of across all cosmetic
 *    questions wins. `capAt` limits how bad THIS question alone can push things
 *    (e.g. a cracked back caps at 'C' even though a cracked screen would hit 'D').
 *  - 'display-defect': multi-select; anything other than `noneKey` forces the grade
 *    to at least `forceGrade`.
 *  - 'functional' / 'functional-checklist': track a separate "something doesn't
 *    work" flag rather than moving the grade directly.
 *
 * A functional defect floors the final grade at 'C' — a phone can look mint and
 * still not be worth a mint price if it doesn't fully work, but a purely cosmetic
 * issue never gets *better* than the functional floor makes it.
 *
 * If NONE of the category's questions declare a gradeRole (an older/unmigrated
 * category), falls back to the legacy severity-index system for backward
 * compatibility — same behavior as before this system existed.
 *
 * @param {Object} conditionAnswers - map of questionKey -> chosen optionKey (or, for
 *   multi-select questions, an array of chosen optionKeys)
 * @param {Array} assessmentQuestions - the category's Category.assessmentQuestions
 * @returns {String} one of GRADES
 */
export const computeGrade = (conditionAnswers, assessmentQuestions) => {
  if (!assessmentQuestions || !assessmentQuestions.length) return 'C'; // no config — neutral fallback

  const isRoleBased = assessmentQuestions.some((q) => q.gradeRole && q.gradeRole !== 'cosmetic')
    || assessmentQuestions.some((q) => q.gradeRole === 'cosmetic' && (q.options || []).some((o) => o.key.toUpperCase() in RANK));
  if (!isRoleBased) return legacySeverityGrade(conditionAnswers, assessmentQuestions);

  let grade = 'A';
  let functionalDefect = false;

  for (const question of assessmentQuestions) {
    const role = question.gradeRole || 'cosmetic';
    const answer = conditionAnswers ? conditionAnswers[question.key] : undefined;
    if (!answer) continue;

    if (role === 'cosmetic') {
      let letter = String(answer).toUpperCase();
      if (question.capAt && RANK[letter] > RANK[question.capAt.toUpperCase()]) {
        letter = question.capAt.toUpperCase();
      }
      grade = worstOf(grade, letter);
    } else if (role === 'display-defect') {
      const noneKey = question.noneKey || 'none';
      const chosen = Array.isArray(answer) ? answer : [answer];
      const hasDefect = chosen.some((v) => v && v !== noneKey);
      if (hasDefect) grade = worstOf(grade, (question.forceGrade || 'E').toUpperCase());
    } else if (role === 'functional') {
      if (answer === (question.badKey || 'fail')) functionalDefect = true;
    } else if (role === 'functional-checklist') {
      const noneKey = question.noneKey || 'none';
      const chosen = Array.isArray(answer) ? answer : [answer];
      const hasIssue = chosen.some((v) => v && v !== noneKey);
      if (hasIssue) functionalDefect = true;
    }
  }

  if (functionalDefect) grade = worstOf(grade, 'C');

  return grade;
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
