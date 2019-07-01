/**
 * Raw-Lambda Implementation
 *
 * This is a `graphql` server running in a Lambda via direct-to-lambda
 * invocation, not to be confused with an `apollo-server-lambda`
 * implementation, which would require you to be using it as a public
 * endpoint via API Gateway.
 *
 * @example
 * ```
 * {
 *   Payload: {
 *     "query": "query GetBreeds { breeds { edges { node { id } } } }",
 *     "variables": {},
 *     "operationName": "GetBreeds",
 *     "context": {
 *       "viewer": {},
 *       "requestId": ""
 *     }
 *   }
 * }
 * ```
 */
const { graphql } = require('graphql');

const { promisify } = require('../lib/lambda-promisify');
const { schema } = require('../graphql/schema');
const { buildContext } = require('../lib/build-context');

const graphqlHandler = (event, awsContext, cb) => {
  const { query, variables, operationName, context } = event;

  const graphqlContext = buildContext({
    viewer: context.viewer,
    requestId: context.requestId,
  });
  const rootValue = null;

  return graphql(schema, query, rootValue, graphqlContext, variables, operationName);
};

exports.graphql = promisify(graphqlHandler);
