export const logger = {
  info(message: string, data?: unknown) {
    console.log(JSON.stringify({ level: 'INFO', message, data, timestamp: new Date().toISOString() }))
  },
  warn(message: string, data?: unknown) {
    console.warn(JSON.stringify({ level: 'WARN', message, data, timestamp: new Date().toISOString() }))
  },
  error(message: string, error?: unknown) {
    console.error(JSON.stringify({
      level: 'ERROR',
      message,
      error: error instanceof Error ? { name: error.name, message: error.message, stack: error.stack } : error,
      timestamp: new Date().toISOString(),
    }))
  },
}
