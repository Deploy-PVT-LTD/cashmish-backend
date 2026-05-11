import geoip from 'geoip-lite';
import Visitor from '../models/visitorModel.js';

export const trackTraffic = async (req, res, next) => {
  try {
    const path = req.path || '';
    
    // 1. Skip tracking for admin-only routes, static files, and internal paths
    const excludedPaths = [
      '/api/traffic',
      '/api/auth',
      '/api/admin',
      '/static',
      '/favicon.ico',
      '/stats'
    ];

    if (excludedPaths.some(p => path.includes(p)) || req.headers['x-admin-request']) {
      return next();
    }

    // Also skip tracking for any GET request that looks like an admin heartbeat/polling
    if (path.endsWith('/stats') || path.includes('/chat/sessions')) {
      return next();
    }

    const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress || req.ip;
    
    // 2. Deduplication: Don't count multiple requests from same IP within a short window (e.g. 30 mins)
    // This prevents the count from increasing on every click or refresh
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    const existingVisit = await Visitor.findOne({
      ip,
      createdAt: { $gte: thirtyMinutesAgo }
    });

    if (existingVisit) {
      return next();
    }

    // 3. Geolocation
    // Note: Localhost IPs (::1, 127.0.0.1) will ALWAYS return null/Unknown in geoip-lite
    const geo = geoip.lookup(ip);

    await Visitor.create({
      ip,
      country: geo?.country || 'Unknown',
      region: geo?.region || 'Unknown',
      city: geo?.city || 'Unknown',
      userAgent: req.headers['user-agent'],
      path: req.originalUrl || path
    });

    next();
  } catch (error) {
    console.error('Traffic tracking error:', error);
    next();
  }
};
