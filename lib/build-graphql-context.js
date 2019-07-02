const Loaders = require('./loaders');
const { requestLogger } = require('./logger');
const Request = require('./request');

/**
 * buildContext
 *
 * Here we initialize each Context component.
 *
 * We DO NOT inject the GraphQL context into any of these components. Each of
 * them gets the properties it needs, and nothing else.
 *
 * We then return the context, which has all of those components on it.
 */
exports.buildContext = ({ viewer, requestId }) => {
  const logger = requestLogger({ requestId });
  const request = Request.initialize({ logger, requestId });
  const loaders = Loaders.initialize({ viewer, logger, request });

  const graphqlContext = {
    logger,
    loaders,
    request,
  };

  return graphqlContext;
};
