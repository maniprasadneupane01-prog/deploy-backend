const WINDOW_MS  = 60 * 1000;
const MAX_HITS   = 15;
const store      = new Map();

setInterval(() => {
  const cutoff = Date.now() - WINDOW_MS;
  for (const [ip, hits] of store) {
    const fresh = hits.filter(t => t > cutoff);
    if (fresh.length === 0) store.delete(ip);
    else store.set(ip, fresh);
  }
}, 5 * 60 * 1000);

function rateLimit(req, res, next) {
  const ip     = req.ip || req.connection.remoteAddress || 'unknown';
  const now    = Date.now();
  const cutoff = now - WINDOW_MS;
  const hits   = (store.get(ip) || []).filter(t => t > cutoff);

  if (hits.length >= MAX_HITS) {
    return res.status(429).json({
      success: false,
      error:   'RATE_LIMITED',
      message: 'Too many requests. Please wait a moment and try again.'
    });
  }
  hits.push(now);
  store.set(ip, hits);
  next();
}

module.exports = rateLimit;
