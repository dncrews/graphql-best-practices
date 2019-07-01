const breeds = require('./breeds');

exports.initialize = ({ viewer, request }) => {
  return {
    breeds: breeds.initialize({ viewer, request }),
  };
};
