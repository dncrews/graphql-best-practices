/**
 * Pagination Algorithms
 *
 * Here you can see the correct way of handling cursor-based pagination
 * per the Relay spec. This is difficult to replicate outside of database-
 * driven cursor-based pagination as you really need to start with the entire
 * set, but here is an in-memory solution for it.
 *
 * Pagination Algorithms derived from the Relay specification
 * @see https://facebook.github.io/relay/graphql/connections.htm#sec-Pagination-algorithm
 */

/**
 * applyCursorsToEdges
 *
 * This method strips away all items including and after the `before`
 * This method strips away all items up to and including the `after`
 *
 * In SQL, if you're using numeric primary keys, you could derive your cursor
 * from that, allowing for:
 * `before` to be `AND ID < ${cursor}`
 * `after` to be `AND ID > ${cursor}`
 * (note the absence of "or equal to")
 *
 * Since numeric primary keys are considered an anti-pattern, however,
 * this can be frustrating to mimic using proper database best-practices,
 * since there's no context for uuid > uuid.
 */
const applyCursorsToEdges = ({ allEdges, before, after }) => {
  let edges = allEdges;
  let hasPreviousPage = false;
  let hasNextPage = false;

  if (after) {
    const startLength = edges.length;
    const afterPointer =
      edges.findIndex(element => {
        return element.cursor === after;
      }) + 1;

    // Take ONLY the items after
    edges = edges.slice(afterPointer);
    if (edges.length < startLength) {
      hasPreviousPage = true;
    }
  }

  if (before) {
    const startLength = edges.length;
    const itemPointer = edges.findIndex(element => {
      return element.cursor === before;
    });

    // Delete all the pointer and all after it
    edges.splice(itemPointer);
    if (edges.length < startLength) {
      hasNextPage = true;
    }
  }

  return {
    edges,
    pageInfo: {
      hasPreviousPage,
      hasNextPage,
    },
  };
};

/**
 * edgesToReturn
 *
 * This method applies the before and after method and reduces
 * the list to the expected length, as defined by `first` or `last`
 *
 * In SQL, you could mimic this by changing your "order", but do be
 * aware that the Relay spec does NOT specify that the returned order
 * may be in reverse, so you would need to reverse your results before
 * returning to the client.
 */
const edgesToReturn = ({ allEdges, first, last, before, after }) => {
  let { edges, pageInfo } = applyCursorsToEdges({ allEdges, before, after });

  if (first) {
    if (first < 0) {
      throw new Error('first must be greater than 0');
    }
    if (edges.length > first) {
      edges = edges.slice(0, first);
    }
  }

  if (last) {
    if (last && last < 0) {
      throw new Error('last must be greater than 0');
    }
    if (edges.length > last) {
      edges = edges.slice(-last);
    }
  }

  return { edges, pageInfo };
};

/**
 * validatePaginationArguments
 *
 * This method ensures `first` and `last` are both not used. The
 * Relay spec says that both are __ALLOWED__, but also discourages
 * the practice, so we preven this here.
 */
const validatePaginationArguments = ({ first, last, before, after }) => {
  if (first && last) {
    throw new Error('Cannot page both forward and backward');
  }

  return { first, last, before, after };
};

exports.applyCursorsToEdges = applyCursorsToEdges;
exports.edgesToReturn = edgesToReturn;
exports.validatePaginationArguments = validatePaginationArguments;
