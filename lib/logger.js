const bunyan = require('bunyan');
const config = require('config');

const log = bunyan.createLogger({
  name: 'graphql-best-practices',
  streams: [
    {
      level: config.get('logging.level'),
      stream: process.stdout,
    },
  ],
});

/**
 * Bunyan doesn't bind these, so it's painful to pass around
 */
exports.logger = {
  trace: log.trace.bind(log),
  info: log.info.bind(log),
  warn: log.warn.bind(log),
  error: log.error.bind(log),
};

exports.requestLogger = ({ requestId }) => {
  const childLogger = log.child({ requestId });

  return {
    trace: childLogger.trace.bind(childLogger),
    info: childLogger.info.bind(childLogger),
    warn: childLogger.warn.bind(childLogger),
    error: childLogger.error.bind(childLogger),
  };
};
