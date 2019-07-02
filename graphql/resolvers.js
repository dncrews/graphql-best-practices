/**
 * Resolvers File
 *
 * The resolvers file should have ALMOST ZERO requires. The only exceptions are files
 * that are used to reformat the request into what the libs should use, but there are
 * NOT exceptions for any file that will perform any I/O or for the business-logic
 * libs themselves. Those must be injected onto the `context` object.
 */
const assert = require('assert');
const { fromGlobalId, toGlobalId } = require('graphql-relay');

const { edgesToReturn, validatePaginationArguments } = require('../lib/pagination');

/**
 * The order here should match the order in the type-definitions file:
 *
 * 1. Query
 * 2. Mutation
 * 3. Everything else in alphabetical order
 *
 * Generally, I try to keep the properties in alphabetical order, too, as it is easier
 * to see when you're accidentally duplicating them. (Don't laugh, that happens a lot)
 */
exports.resolvers = {
  Query: {
    /**
     * Until you are familiar with what all of these arguments are and with
     * what they represent, I recommend you do NOT destructure these values
     * and always call them by these names `parent`, `args`, `context`, `info`
     */
    breedById(parent, args, context) {
      const nodeId = args.id;

      /**
       * GraphQL will make sure that your types are the correct types,
       * but things like "length" will not be checked. A value of `""` is
       * still a valid string, so always make sure you validate your input.
       */
      assert(nodeId.length > 0, 'breedById requires an ID to be provided');
      const { id } = fromGlobalId(nodeId);

      return context.loaders.breeds.load(id);
    },
    async breeds(parent, args, context) {
      const { fluffy, favorite } = args;

      /**
       * Business logic does not belong in the resolvers code. The purpose of
       * this file is ONLY to translate the API. If you were to delete GraphQL
       * and replace it with REST (or if you also had a REST API that other
       * applications interacted with), you should only have to rewrite the REST
       * pieces and the logic should not have to be rebuilt or duplicated.
       */
      const breeds = await context.loaders.breeds.list({
        fluffy,
        favorite,
      });

      return {
        breeds,
      };
    },
  },
  Mutation: {
    async viewerSaveFavoriteBreed(parent, args, context) {
      const { clientMutationId, breedId } = args.input;
      const { id } = fromGlobalId(breedId);

      try {
        /**
         * Be careful when you're trying to return a promise without using `await`. GraphQL will return the promise
         * and the try/catch from here won't fire, but the default GraphQL error handler will fire.
         */
        const breedName = await context.loaders.breeds.makeFavorite(id);

        return {
          clientMutationId,
          breedName,
        };
      } catch (error) {
        return {
          clientMutationId,
          error,
        };
      }
    },
  },
  Breed: {
    async photos(parent, args, context) {
      const { first, last, before, after } = validatePaginationArguments(args);
      const images = await context.loaders.breeds.loadPhotos({
        breedName: parent.name,
      });
      const allEdges = images.map(image => {
        return {
          cursor: Buffer.from(image.url).toString('base64'),
          node: image,
        };
      });

      return edgesToReturn({ allEdges, first, last, before, after });
    },
  },
  BreedPhotosConnection: {
    images(parent) {
      return parent.edges.map(edge => {
        return edge.node;
      });
    },
  },
  MutationError: {
    __resolveType() {
      throw new Error('You should never actually have anything in your schema that returns this type');
    },
    error(parent) {
      const { code, message, friendlyMessage } = parent.error;

      if (!(code && message && friendlyMessage)) {
        throw parent.error;
      }

      return {
        code,
        message,
        friendlyMessage,
      };
    },
  },
  MutationSuccess: {
    __resolveType() {
      throw new Error('You should never actually have anything in your schema that returns this type');
    },
  },
  Node: {
    /**
     * FIXME: If you're going to use the Node type (and node query), you need to solve this
     */
    __resolveType() {
      throw new Error('Not yet implemented');
    },
    id(parent, args, context, info) {
      return toGlobalId(info.parentType, parent.id);
    },
  },
  ViewerBreedsConnection: {
    edges(parent) {
      return parent.breeds;
    },
  },
  ViewerBreedsEdge: {
    favorited(parent) {
      return parent.favorite;
    },
    node(parent) {
      return parent;
    },
  },
  ViewerSaveFavoriteBreedPayload: {
    __resolveType(parent) {
      if (parent.error) {
        return 'ViewerSaveFavoriteBreedError';
      }

      return 'ViewerSaveFavoriteBreedSuccess';
    },
  },
  ViewerSaveFavoriteBreedSuccess: {
    async breed(parent, args, context) {
      const { breedName } = parent;

      return context.loaders.breeds.load(breedName);
    },
    async favorites(parent, args, context) {
      return {
        breeds: await context.loaders.breeds.list({
          favorite: true,
        }),
      };
    },
  },
};
