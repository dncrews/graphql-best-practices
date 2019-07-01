const { ApolloServer } = require('apollo-server');

const { schema } = require('../graphql/schema');
const { buildContext } = require('../lib/build-context');

const server = new ApolloServer({
  schema,
  context({ req }) {
    return buildContext({
      viewer: req.user,
    });
  },
});

server.listen().then(({ url }) => {
  console.info(`Server ready at ${url}`);
});
