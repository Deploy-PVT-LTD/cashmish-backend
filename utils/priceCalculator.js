/**
 * Calculate estimated mobile price based on conditions
 * @param {Number} basePrice - mobile base price from DB
 * @param {Object} conditions - phone condition object
 * @param {Object} [rules] - optional deduction rules
 * @returns {Number} final estimated price
 */

export const calculatePrice = (basePrice, conditions, rules) => {
  if (!basePrice || !conditions) return 0;

  // deduction rules (percentage)
  const defaultRules = {
    screen: {
      perfect: 0,
      scratched: 10,
      cracked: 25
    },
    body: {
      perfect: 0,
      scratched: 10,
      damaged: 20
    },
    battery: {
      good: 0,
      average: 10,
      poor: 20
    }
  };

  const useRules = rules || defaultRules;

  let totalDeductionPercent = 0;

  if (conditions.screen && useRules.screen[conditions.screen] !== undefined) {
    totalDeductionPercent += useRules.screen[conditions.screen];
  }

  if (conditions.body && useRules.body[conditions.body] !== undefined) {
    totalDeductionPercent += useRules.body[conditions.body];
  }

  if (conditions.battery && useRules.battery[conditions.battery] !== undefined) {
    totalDeductionPercent += useRules.battery[conditions.battery];
  }

  // max limit (optional safety)
  if (totalDeductionPercent > 80) {
    totalDeductionPercent = 80;
  }

  const finalPrice =
    basePrice - (basePrice * totalDeductionPercent) / 100;

  return Math.round(finalPrice < 0 ? 0 : finalPrice);
};
