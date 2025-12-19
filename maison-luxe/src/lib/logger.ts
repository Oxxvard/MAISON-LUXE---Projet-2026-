import pino from 'pino';

const level = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

const p = pino({
  level,
  base: { env: process.env.NODE_ENV },
  timestamp: pino.stdTimeFunctions.isoTime
});

function info(...args: unknown[]) {
  if (args.length === 1 && typeof args[0] === 'string') return p.info(args[0]);
  return p.info({ args });
}

function debug(...args: unknown[]) {
  if (args.length === 1 && typeof args[0] === 'string') return p.debug(args[0]);
  return p.debug({ args });
}

function warn(...args: unknown[]) {
  if (args.length === 1 && typeof args[0] === 'string') return p.warn(args[0]);
  return p.warn({ args });
}

function error(...args: unknown[]) {
  if (args.length === 1 && typeof args[0] === 'string') return p.error(args[0]);
  return p.error({ args });
}

const logger = { info, debug, warn, error };

export default logger;
