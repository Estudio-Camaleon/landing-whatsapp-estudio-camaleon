const store = new Map();

const ONE_MINUTE = 60 * 1000;
const FIVE_MINUTES = 5 * ONE_MINUTE;

const defaults = {
  windowMs: ONE_MINUTE,
  max: 60,
  message: { error: "too_many_requests", message: "Demasiadas solicitudes. Intentá de nuevo en un minuto." },
  statusCode: 429,
};

export function rateLimit(opts) {
  const { windowMs, max, message, statusCode } = { ...defaults, ...opts };

  return function rateLimitMiddleware(req, res) {
    const ip =
      req.headers["x-forwarded-for"]?.split(",")?.[0]?.trim() ||
      req.headers["x-real-ip"] ||
      req.ip ||
      "unknown";

    const key = `${ip}:${req.path || req.url}`;
    const now = Date.now();
    const windowStart = now - windowMs;

    if (!store.has(key)) {
      store.set(key, []);
    }

    const timestamps = store.get(key).filter(t => t > windowStart);

    if (timestamps.length >= max) {
      return res.status(statusCode).json(message);
    }

    timestamps.push(now);
    store.set(key, timestamps);
  };
}

// Cleanup stale entries every 60s
setInterval(() => {
  const cutoff = Date.now() - FIVE_MINUTES;
  for (const [key, timestamps] of store) {
    const valid = timestamps.filter(t => t > cutoff);
    if (valid.length === 0) store.delete(key);
    else store.set(key, valid);
  }
}, ONE_MINUTE);

export const limits = {
  strict: { windowMs: ONE_MINUTE, max: 5, message: { error: "too_many_requests", message: "Demasiados intentos. Esperá un minuto." } },
  default: { windowMs: ONE_MINUTE, max: 60 },
  public: { windowMs: ONE_MINUTE, max: 30 },
};
