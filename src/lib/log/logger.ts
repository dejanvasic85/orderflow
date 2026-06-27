import { type LogLevel, logColorReset, logColorValue } from "./constants";

type LogFields = Record<string, unknown>;

export type Logger = {
  debug: (event: string, msg: string, fields?: LogFields) => void;
  info: (event: string, msg: string, fields?: LogFields) => void;
  warn: (event: string, msg: string, fields?: LogFields) => void;
  error: (event: string, msg: string, fields?: LogFields) => void;
};

// warn/error route through the matching console method so Workers Logs classifies
// them correctly; debug/info go through console.log. Resolved at call time (not
// captured at module load) so spies/overrides on console.* are honoured.
function writeForLevel(level: LogLevel, line: string): void {
  switch (level) {
    case "warn":
      console.warn(line);
      return;
    case "error":
      console.error(line);
      return;
    default:
      console.log(line);
  }
}

function serializeFields(fields: LogFields): LogFields {
  const out: LogFields = {};
  for (const [key, value] of Object.entries(fields)) {
    out[key] = value instanceof Error ? { name: value.name, message: value.message } : value;
  }
  return out;
}

function formatFieldsForDev(fields: LogFields): string {
  const parts = Object.entries(fields).map(([key, value]) => {
    const rendered = typeof value === "string" ? value : JSON.stringify(value);
    return `${key}=${rendered}`;
  });
  return parts.length > 0 ? `  ${parts.join(" ")}` : "";
}

function emit(level: LogLevel, event: string, msg: string, fields: LogFields): void {
  const serialized = serializeFields(fields);

  if (import.meta.env.DEV) {
    const time = new Date().toISOString().slice(11, 19);
    const color = logColorValue[level];
    const label = level.toUpperCase().padEnd(5);
    writeForLevel(
      level,
      `${time} ${color}${label}${logColorReset} ${event}  ${msg}${formatFieldsForDev(serialized)}`,
    );
    return;
  }

  writeForLevel(
    level,
    JSON.stringify({ level, event, msg, ts: new Date().toISOString(), ...serialized }),
  );
}

export const log: Logger = {
  debug: (event, msg, fields = {}) => emit("debug", event, msg, fields),
  info: (event, msg, fields = {}) => emit("info", event, msg, fields),
  warn: (event, msg, fields = {}) => emit("warn", event, msg, fields),
  error: (event, msg, fields = {}) => emit("error", event, msg, fields),
};

// Wraps the base logger so every line carries a correlation id (e.g. a per-request
// reqId). Used by the request middleware.
export function createRequestLogger(reqId: string): Logger {
  return {
    debug: (event, msg, fields = {}) => log.debug(event, msg, { reqId, ...fields }),
    info: (event, msg, fields = {}) => log.info(event, msg, { reqId, ...fields }),
    warn: (event, msg, fields = {}) => log.warn(event, msg, { reqId, ...fields }),
    error: (event, msg, fields = {}) => log.error(event, msg, { reqId, ...fields }),
  };
}
