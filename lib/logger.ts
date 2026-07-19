import pino from "pino";
import { env } from "@/lib/env";

const isDev = env.NODE_ENV !== "production";

export const logger = pino({
  level: env.LOG_LEVEL || (isDev ? "debug" : "info"),
  transport: isDev
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          ignore: "pid,hostname",
          translateTime: "SYS:standard",
        },
      }
    : undefined,
  redact: ["password", "token", "secret", "cookie", "authorization"],
});
