/**
 * Revenue Recognition Service
 * Calculates daily revenue for memberships with freeze logic
 */

/**
 * Check if a date is within a freeze period
 * @param {Date} date - Date to check
 * @param {Array} freezePeriods - Array of freeze period objects
 * @returns {boolean}
 */
function isFrozen(date, freezePeriods) {
  if (!freezePeriods || freezePeriods.length === 0) return false;
  
  return freezePeriods.some(freeze => {
    const freezeStart = new Date(freeze.start_date);
    const freezeEnd = new Date(freeze.end_date);
    return date >= freezeStart && date <= freezeEnd;
  });
}

/**
 * Calculate daily revenue for a membership
 * Excludes frozen days from revenue calculation
 * 
 * @param {Object} membership - Membership object with plan and freeze periods
 * @param {Object} membership.plan - Plan with daily_rate
 * @param {string} membership.start_date - Membership start date
 * @param {string} membership.end_date - Membership end date (optional)
 * @param {Array} membership.freeze_periods - Array of freeze periods
 * @returns {Object} { total_revenue, active_days, daily_rate, frozen_days }
 */
function calculateDailyRevenue(membership) {
  const { start_date, end_date, plan, freeze_periods = [] } = membership;
  
  if (!plan || !plan.daily_rate) {
    throw new Error('Membership must have a plan with daily_rate');
  }

  const dailyRate = parseFloat(plan.daily_rate);
  const startDate = new Date(start_date);
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Start of today
  
  // End date is either membership end_date or today (whichever is earlier)
  let endDate;
  if (end_date) {
    endDate = new Date(end_date);
    if (endDate > today) endDate = today;
  } else {
    endDate = today;
  }

  // Count active days (excluding freezes)
  let activeDays = 0;
  let frozenDays = 0;
  let currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    if (isFrozen(currentDate, freeze_periods)) {
      frozenDays++;
    } else {
      activeDays++;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  const totalRevenue = activeDays * dailyRate;

  return {
    total_revenue: parseFloat(totalRevenue.toFixed(2)),
    active_days: activeDays,
    frozen_days: frozenDays,
    daily_rate: dailyRate,
    currency: membership.payment_currency || 'EUR'
  };
}

/**
 * Calculate end date for a membership based on plan type
 * 
 * @param {Date} startDate - Membership start date
 * @param {Object} plan - Membership plan
 * @param {string} plan.type - Plan type (monthly, quarterly, annual, lifetime, custom)
 * @param {number} plan.duration_days - Duration in days (for custom plans)
 * @returns {Date|null} End date or null for lifetime
 */
function calculateEndDate(startDate, plan) {
  const start = new Date(startDate);
  
  if (plan.type === 'lifetime') {
    return null;
  }

  let durationDays;
  
  switch (plan.type) {
    case 'monthly':
      durationDays = 30;
      break;
    case 'quarterly':
      durationDays = 90;
      break;
    case 'annual':
      durationDays = 365;
      break;
    case 'custom':
      durationDays = plan.duration_days;
      break;
    default:
      throw new Error(`Unknown plan type: ${plan.type}`);
  }

  const endDate = new Date(start);
  endDate.setDate(endDate.getDate() + durationDays);
  return endDate;
}

/**
 * Calculate MRR (Monthly Recurring Revenue) for active memberships
 * 
 * @param {Array} memberships - Array of active memberships with plans
 * @returns {number} Monthly recurring revenue in EUR
 */
function calculateMRR(memberships) {
  let totalMRR = 0;

  memberships.forEach(membership => {
    if (membership.status !== 'active') return;
    
    const dailyRate = parseFloat(membership.plan.daily_rate);
    
    // Convert to EUR if needed (simplified - assume EUR for now)
    // In real implementation, would use exchange rates
    const dailyRateEUR = dailyRate; 
    
    // MRR = daily_rate * 30 (approximate days per month)
    totalMRR += dailyRateEUR * 30;
  });

  return parseFloat(totalMRR.toFixed(2));
}

module.exports = {
  calculateDailyRevenue,
  calculateEndDate,
  calculateMRR,
  isFrozen
};
