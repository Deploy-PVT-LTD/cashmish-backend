import Visitor from '../models/visitorModel.js';

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

    // Get recent visitors
    const recentVisitors = await Visitor.find()
      .sort({ createdAt: -1 })
      .limit(50);

    // Get unique visitors count (by IP)
    const uniqueVisitors = await Visitor.distinct('ip');

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
