import Visitor from '../models/visitorModel.js';

// Simple ping handler — just responds OK.
// The actual visitor recording is done by the trackTraffic middleware before this runs.
export const pingVisitor = (req, res) => {
  res.status(200).json({ success: true });
};

export const getTrafficStats = async (req, res) => {
  try {
    const totalVisitors = await Visitor.countDocuments();
    
    // Group by country
    const countryStats = await Visitor.aggregate([
      { $group: { _id: "$country", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Group by region (state)
    const regionStats = await Visitor.aggregate([
      { $group: { _id: { country: "$country", region: "$region" }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Get unique visitors count (by IP)
    const uniqueVisitors = await Visitor.distinct('ip');

    // Get visitors in the last 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentVisitors = await Visitor.find({ createdAt: { $gte: twentyFourHoursAgo } })
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json({
      success: true,
      data: {
        totalVisitors,
        uniqueVisitors: uniqueVisitors.length,
        countryStats,
        regionStats,
        recentVisitors
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching traffic stats',
      error: error.message
    });
  }
};

export const getTrafficHistory = async (req, res) => {
    try {
        // Last 30 days traffic trend
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const history = await Visitor.aggregate([
            {
                $match: {
                    createdAt: { $gte: thirtyDaysAgo }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: "$createdAt" },
                        month: { $month: "$createdAt" },
                        day: { $dayOfMonth: "$createdAt" }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } }
        ]);

        res.status(200).json({
            success: true,
            data: history
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching traffic history',
            error: error.message
        });
    }
}
