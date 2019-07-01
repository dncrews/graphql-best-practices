const { makeExecutableSchema } = require('graphql-tools');

const { typeDefs } = require('./type-definitions.graphql');
const { resolvers } = require('./resolvers');

exports.schema = makeExecutableSchema({
  typeDefs,
  resolvers,
  inheritResolversFromInterfaces: true,
});
