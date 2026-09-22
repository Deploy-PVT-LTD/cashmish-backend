/**
 * Calculate estimated price based on condition answers.
 *
 * Generic by design: `conditions` is a map of questionKey -> chosen optionKey
 * (e.g. { screen: 'cracked', body: 'perfect' } for phones, or
 * { controller: 'included', power: 'works' } for a gaming console) and `rules`
 * is the matching map of questionKey -> { optionKey: percentDeduction }. This
 * makes it work for any category's question set, not just phones — for phones
 * specifically the keys still happen to be screen/body/battery, so existing
 * behavior is unchanged.
 *
 * @param {Number} basePrice - product base price from DB
 * @param {Object} conditions - map of questionKey -> chosen optionKey
 * @param {Object} [rules] - map of questionKey -> { optionKey: percentDeduction }
 * @returns {Number} final estimated price
 */

// Fallback used only if no rules are supplied at all (defensive — callers should
// always pass the product/category's effective rules).
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
