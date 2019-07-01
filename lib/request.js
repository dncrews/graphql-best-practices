const axios = require('axios');

exports.initialize = ({ logger }) => {
  return async (url, options) => {
    try {
      const res = await axios(url, options);

      console.info({ request: res.request });

      logger.info({ status: res.status, url: `${url}${res.request.path}` });

      return res.data;
    } catch (error) {
      console.info(error);
      logger.error({
        status: error.status,
        url: `${url}${error.request.path}`,
        error: error.message,
      });

      throw error;
    }
  };
};
