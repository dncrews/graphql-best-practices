const breeds = require('./breeds');

exports.initialize = ({ viewer, accessToken, request }) => {
  return {
    breeds: breeds.initialize({ viewer, accessToken, request }),
  };
};
