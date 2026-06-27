export const logLevels = ["debug", "info", "warn", "error"] as const;

export type LogLevel = (typeof logLevels)[number];

// ANSI codes for pretty dev rendering; keyed by level.
export const logColorValue = {
  debug: "\x1b[90m", // grey
  info: "\x1b[36m", // cyan
  warn: "\x1b[33m", // yellow
  error: "\x1b[31m", // red
} as const;

export const logColorReset = "\x1b[0m";
