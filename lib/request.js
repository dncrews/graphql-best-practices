const axios = require('axios');

exports.initialize = ({ logger, requestId }) => {
  const instance = axios.create({
    headers: { 'request-id': requestId },
  });

  return async (url, options) => {
    try {
      const res = await instance(url, options);

      logger.info({ status: res.status, url: `${url}${res.request.path}` });

      return res.data;
    } catch (error) {
      logger.error({
        status: error.status,
        url: `${url}${error.request.path}`,
        error: error.message,
      });

      throw error;
    }
  };
};
