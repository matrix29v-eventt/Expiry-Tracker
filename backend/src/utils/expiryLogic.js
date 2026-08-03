const DAY = 1000 * 60 * 60 * 24;

export const startOfToday = (date = new Date()) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

export const endOfToday = (date = new Date()) => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

export const daysUntil = (expiryDate, now = new Date()) => {
  return Math.ceil((new Date(expiryDate) - new Date(now)) / DAY);
};

export const addDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

/**
 * Classifies an expiry date relative to "now".
 * Returns "expired", "expiringToday" or "upcoming".
 */
export const classifyExpiry = (expiryDate, now = new Date()) => {
  const date = new Date(expiryDate);

  if (date < startOfToday(now)) return "expired";
  if (date <= endOfToday(now)) return "expiringToday";
  return "upcoming";
};
