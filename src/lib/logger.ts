type Level = "debug" | "info" | "warn" | "error" | "silent";

const levels: Record<Level, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  silent: 99,
};

function getConfiguredLevel(): number {
  if (typeof window === "undefined") {
    return levels[(process.env.LOG_LEVEL as Level) || "silent"];
  }
  try {
    const stored = localStorage.getItem("logLevel") as Level | null;
    return levels[stored ?? "silent"];
  } catch {
    return 99;
  }
}

function log(level: Level, context: string, message: string, data?: unknown) {
  const configured = getConfiguredLevel();
  if (levels[level] < configured) return;

  const ts = new Date().toISOString();
  const prefix = `[${ts}] [${level.toUpperCase()}] [${context}]`;

  if (data !== undefined) {
    if (level === "error") {
      console.error(prefix, message, data);
    } else if (level === "warn") {
      console.warn(prefix, message, data);
    } else {
      console.log(prefix, message, data);
    }
  } else {
    if (level === "error") {
      console.error(prefix, message);
    } else if (level === "warn") {
      console.warn(prefix, message);
    } else {
      console.log(prefix, message);
    }
  }
}

export function createLogger(context: string) {
  return {
    debug: (message: string, data?: unknown) => log("debug", context, message, data),
    info: (message: string, data?: unknown) => log("info", context, message, data),
    warn: (message: string, data?: unknown) => log("warn", context, message, data),
    error: (message: string, data?: unknown) => log("error", context, message, data),
  };
}
