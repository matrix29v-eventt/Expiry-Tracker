import rateLimit from "express-rate-limit";

const baseOptions = {
  standardHeaders: true,
  legacyHeaders: false,
};

/* Tighter limit for credential endpoints (login, register, resets, ...) */
export const authLimiter = rateLimit({
  ...baseOptions,
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: "Too many attempts. Please try again in 15 minutes." },
});

/* General API limit */
export const apiLimiter = rateLimit({
  ...baseOptions,
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { message: "Too many requests. Please slow down." },
});
