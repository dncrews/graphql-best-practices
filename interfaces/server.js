const { ApolloServer } = require('apollo-server');
const { uuidv4 } = require('uuid/v4');

const { schema } = require('../graphql/schema');
const { buildContext } = require('../lib/build-context');

const server = new ApolloServer({
  schema,
  context({ req }) {
    return buildContext({
      viewer: req.user,
      requestId: req.headers['request-id'] || uuidv4(),
    });
  },
});

server.listen().then(({ url }) => {
  console.info(`Server ready at ${url}`);
});
