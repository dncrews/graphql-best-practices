const Loaders = require('../lib/loaders');
const { logger } = require('../lib/logger');
const Request = require('../lib/request');

exports.buildContext = ({ viewer, accessToken }) => {
  const request = Request.initialize({ logger });
  const loaders = Loaders.initialize({ viewer, accessToken, logger, request });

  return {
    logger,
    loaders,
    request,
  };
};
