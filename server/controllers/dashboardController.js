const supabase = require('../config/database');
const { calculateMRR } = require('../services/revenueService');

/**
 * Get dashboard metrics
 * GET /api/dashboard/metrics
 */
exports.getMetrics = async (req, res, next) => {
  try {
    const { tenant_id } = req.user;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get active memberships count
    const { data: activeMemberships, error: activeError } = await supabase
      .from('memberships')
      .select('id')
      .eq('tenant_id', tenant_id)
      .eq('status', 'active');

    if (activeError) throw activeError;

    const activeCount = activeMemberships.length;

    // Get memberships with plans for MRR calculation
    const { data: membershipsForMRR, error: mrrError } = await supabase
      .from('memberships')
      .select('*, plan:plan_id(*)')
      .eq('tenant_id', tenant_id)
      .eq('status', 'active');

    if (mrrError) throw mrrError;

    const mrr = calculateMRR(membershipsForMRR);

    // Get expiring memberships (30, 14, 7, 3 days)
    const expiringCounts = {};
    const periods = [30, 14, 7, 3];

    for (const days of periods) {
      const expiryDate = new Date(today);
      expiryDate.setDate(expiryDate.getDate() + days);

      const { data, error } = await supabase
        .from('memberships')
        .select('id')
        .eq('tenant_id', tenant_id)
        .in('status', ['active', 'frozen'])
        .lte('end_date', expiryDate.toISOString().split('T')[0])
        .gte('end_date', today.toISOString().split('T')[0]);

      if (error) throw error;
      expiringCounts[`days_${days}`] = data.length;
    }

    // Get total revenue (all memberships)
    // This is a simplified version - in production, should sum from journal_entries
    const { data: allMemberships, error: revenueError } = await supabase
      .from('memberships')
      .select(`
        *,
        plan:plan_id(*),
        freeze_periods:membership_freeze(*)
      `)
      .eq('tenant_id', tenant_id);

    if (revenueError) throw revenueError;

    // Calculate total revenue (would be better to store in journal_entries)
    let totalRevenue = 0;
    allMemberships.forEach(membership => {
      if (membership.plan && membership.plan.daily_rate) {
        const startDate = new Date(membership.start_date);
        const endDate = membership.end_date ? new Date(membership.end_date) : today;
        const actualEnd = endDate > today ? today : endDate;
        
        // Simple calculation (doesn't account for freezes - for quick demo)
        const days = Math.max(0, Math.ceil((actualEnd - startDate) / (1000 * 60 * 60 * 24)));
        totalRevenue += days * parseFloat(membership.plan.daily_rate);
      }
    });

    res.json({
      active_members: activeCount,
      expiring_members: {
        total: expiringCounts.days_30,
        within_30_days: expiringCounts.days_30,
        within_14_days: expiringCounts.days_14,
        within_7_days: expiringCounts.days_7,
        within_3_days: expiringCounts.days_3
      },
      mrr: parseFloat(mrr.toFixed(2)),
      total_revenue: parseFloat(totalRevenue.toFixed(2)),
      currency: 'EUR'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = exports;
