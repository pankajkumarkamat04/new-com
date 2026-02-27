import Order from '../models/Order.js';

/**
 * Normalize status filter: frontend may send "paid" | "processing" etc;
 * backend Order schema uses: pending, confirmed, shipped, delivered, cancelled.
 */
function normalizeStatus(status) {
  if (!status || status === 'all') return null;
  const s = String(status).toLowerCase();
  if (['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'].includes(s)) return s;
  if (s === 'paid') return 'confirmed';
  if (s === 'processing') return 'confirmed';
  return null;
}

/**
 * Get sales report: summary + breakdown by period (day/week/month).
 * Query params: dateFrom (YYYY-MM-DD), dateTo (YYYY-MM-DD), status (all|pending|confirmed|...), groupBy (day|week|month).
 */
export const getSalesReport = async (req, res) => {
  try {
    const { dateFrom, dateTo, status: statusFilter, groupBy = 'day' } = req.query;

    const fromStr = (dateFrom || '').toString().trim();
    const toStr = (dateTo || '').toString().trim();

    const query = {};

    if (fromStr || toStr) {
      query.createdAt = {};
      if (fromStr) {
        const fromDate = new Date(fromStr + 'T00:00:00.000Z');
        if (!Number.isNaN(fromDate.getTime())) query.createdAt.$gte = fromDate;
      }
      if (toStr) {
        const toDate = new Date(toStr + 'T23:59:59.999Z');
        if (!Number.isNaN(toDate.getTime())) query.createdAt.$lte = toDate;
      }
      if (Object.keys(query.createdAt).length === 0) delete query.createdAt;
    }

    const status = normalizeStatus(statusFilter);
    if (status) query.status = status;

    const validGroupBy = ['day', 'week', 'month'].includes(String(groupBy)) ? groupBy : 'day';

    // Build date expression for $group based on groupBy
    let dateExpr;
    if (validGroupBy === 'day') {
      dateExpr = {
        year: { $year: '$createdAt' },
        month: { $month: '$createdAt' },
        day: { $dayOfMonth: '$createdAt' },
      };
    } else if (validGroupBy === 'week') {
      dateExpr = {
        year: { $year: '$createdAt' },
        week: { $week: '$createdAt' },
      };
    } else {
      dateExpr = {
        year: { $year: '$createdAt' },
        month: { $month: '$createdAt' },
      };
    }

    const aggregate = [
      { $match: query },
      {
        $group: {
          _id: dateExpr,
          orders: { $sum: 1 },
          revenue: { $sum: '$total' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.week': 1, '_id.day': 1 } },
    ];

    const [summaryResult, groupedResult] = await Promise.all([
      Order.aggregate([
        { $match: query },
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            totalRevenue: { $sum: '$total' },
          },
        },
      ]),
      Order.aggregate(aggregate),
    ]);

    const totalOrders = summaryResult[0]?.totalOrders ?? 0;
    const totalRevenue = summaryResult[0]?.totalRevenue ?? 0;
    const avgOrderValue = totalOrders > 0 ? Math.round((totalRevenue / totalOrders) * 100) / 100 : 0;

    const rows = groupedResult.map((row) => {
      const id = row._id;
      let periodKey;
      let periodLabel;

      if (validGroupBy === 'day' && id.day != null) {
        const y = id.year;
        const m = String(id.month).padStart(2, '0');
        const d = String(id.day).padStart(2, '0');
        periodKey = `${y}-${m}-${d}`;
        const date = new Date(Date.UTC(y, id.month - 1, id.day));
        periodLabel = date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
      } else if (validGroupBy === 'week' && id.week != null) {
        const y = id.year;
        const w = id.week;
        const firstDay = new Date(Date.UTC(y, 0, 1 + (w - 1) * 7));
        const weekStart = new Date(firstDay);
        weekStart.setUTCDate(weekStart.getUTCDate() - weekStart.getUTCDay() + 1);
        const weekEnd = new Date(weekStart);
        weekEnd.setUTCDate(weekEnd.getUTCDate() + 6);
        periodKey = weekStart.toISOString().slice(0, 10);
        periodLabel = `${weekStart.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })} – ${weekEnd.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}`;
      } else {
        const y = id.year;
        const m = String(id.month).padStart(2, '0');
        periodKey = `${y}-${m}`;
        const date = new Date(Date.UTC(y, id.month - 1, 1));
        periodLabel = date.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
      }

      return {
        periodKey,
        periodLabel,
        orders: row.orders,
        revenue: Math.round(row.revenue * 100) / 100,
      };
    });

    const orders = await Order.find(query)
      .populate('userId', 'name email phone')
      .sort({ createdAt: -1 })
      .limit(500)
      .lean();

    res.json({
      success: true,
      data: {
        summary: {
          totalRevenue,
          totalOrders,
          avgOrderValue,
        },
        rows,
        orders,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
