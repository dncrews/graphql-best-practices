exports.promisify = handler => {
  return async (event, lambdaContext, cb) => {
    try {
      const result = await handler(event, lambdaContext);

      if (cb) {
        return cb(null, result);
      }

      return response;
    } catch (err) {
      if (cb) {
        return cb(err);
      }

      throw err;
    }
  };
};
