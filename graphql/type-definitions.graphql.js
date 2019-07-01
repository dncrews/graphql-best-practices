const gql = require('graphql-tag');

/**
 * # typeDefs
 *
 * The name "typeDefs" is used here so that it can easily be destructured into something
 * that `makeExecutableSchema` can use.
 *
 * ## Naming Conventions
 *
 * ### Type Names
 * Remember first that if your GraphQL schema is going to be stitched into Platform API,
 * all types are global. That means that for TypeNames, you can't use your "Domain Words",
 * but have to use "Global Words". This doesn't hold true for property names inside the
 * objects, but it is true for the object names themselves.
 *
 * e.g.
 * ```graphql
 * type Group {
 *   id: ID!
 *   name: String!
 *   category: GroupCategory!
 * }
 * ```
 *
 * "Group" could mean many many things at a global scale, so you might have to
 * preface it with "User Group" or "Sales Group", to end up with:
 *
 * ```graphql
 * type SalesGroup {
 *   id: ID!
 *   name: String!
 *   """
 *   I didn't have to rename "category". It's just a property, but I did have to
 *   rename the GroupCategory, as the type's name was potentially vague outside of
 *   my domain.
 *   """
 *   category: SalesGroupCategory!
 * }
 * ```
 *
 * The names sometimes get a little long, but it's better to be explicit.
 *
 * ## Order
 * The order of types here are:
 *
 * 1. Query
 * 2. Mutation
 * 3. Everything else in alphabetical order
 */
exports.typeDefs = gql`
  type Query {
    """
    ### Query Naming
    Generally, if you're looking up an object, the name will be 'nounByProperty'.
    If you're fetching a thing directly by 'id', 'noun'-alone is a sufficient name

    ### Nullability
    This "Breed" response type may be null, which would be similar to an HTTP 404 Not Found.
    This is preferrable to throwing a "Not Found" error, since that's what "null" means
    in this case
    """
    breedById(id: ID!): Breed

    """
    ### Query Arguments
    Queries should generally have multiple, separate arguments.

    ### Connections
    Almost always, instead of using an Array on a parent object, you should use a Connection.
    A Connection represents a join table as ParentChildrenConnection. If it is a top-level
    query, it isn't always obvious, but the Parent object is "Viewer", as the returned value
    is a list of the Children based on SOLELY the context of the "Viewer" ("viewer" is the
    preferred term instead of "user" as the consumer of the data isn't always a person).

    ### Nullability
    I have made this Connection non-nullable, since in the case of no results, I recognize
    that a join table still exists. Sometimes it is more valuable (or more accurate) for a
    connection to be nullable. This would be similar to a REST response of an empty array
    vs "404 Not Found".
    """
    breeds(fluffy: Boolean, favorite: Boolean): ViewerBreedsConnection!

    """
    ## Relay Node
    The relay spec describes the "node" query as the mechanism for refetching an object.
    It allows a consumer to not need to refetch an entire query-ful of data to fetch
    additional properties on an object. The "Node" type, by extension is used for all
    refetchable types, and is returned from this query.

    The general example is that as the client, I've requested a list of breeds. The user
    has clicked on one of those breeds, and now I want to fetch information on that breed,
    without having to know the that the Query to fetch a Breed is "breedById". The client
    can, instead as for node(id: "breedId") { ... on Breed { ...whateverFields }}.
    """
    node(id: ID!): Node
  }

  type Mutation {
    """
    ### Mutation Naming

    WIth mutations, for the sake of grouping (among other things), I prefer the noun first:
    'indirectobjectVerbDirectObject'.

    In this example:
    "viewer" is the object you're acting on (indirect object)
    "save favorite breed" is what you're trying to do to the viewer (verb and direct object).
    This could also be named as "breedFavorite", if you consider the breed as the object
    you're trying to act on, and "Favorite" is the [awkward, in this case] verb.


    ### Mutation Response
    Mutations should [almost always] have a non-nullable response type because of the way the
    payload is built. **A mutation should neither succeed nor fail silently.**
    (Mutation Payload types explained further below)
    """
    viewerSaveFavoriteBreed(input: ViewerSaveFavoriteBreedInput!): ViewerSaveFavoriteBreedPayload!
  }

  type Breed implements Node {
    """
    Even if you don't use the "Node" type, do try to include an id on anything that will be
    in a list. Usually it really should have one, and the client will thank you for it
    (https://reactjs.org/docs/lists-and-keys.html)
    If the data source looks it up by something else (name, in this case), I often make a fake
    ID because it's the "right" thing to do. The ID should usually be "opaque to the user", meaning
    they couldn't know what it means, but it should also be of value to the server. "Node" IDs
    in the Relay specification solve this for me, so I usually use that, but you don't have to.
    """
    id: ID!
    name: String!
    fluffy: Boolean!
    favorite: Boolean!
    """
    ### Relay Pagination
    The relay spec [describes cursor-based paginatin](https://facebook.github.io/relay/graphql/connections.htm)
    as the method of pagination for all connection types. Per the spec, all connections
    MUST include this option, though I tend to leave a lot of those components out
    until they're expected by the client.
    @see [YAGNI](https://martinfowler.com/bliki/Yagni.html)
    """
    photos(first: Int, last: Int, before: ID, after: ID): BreedPhotosConnection
  }

  """
  ### Connections
  Almost always, instead of using an Array on a parent object, you should use a Connection.
  A Connection represents a join table as ParentChildrenConnection. If the client ever "just
  wants the list, and not all that extra crap", still create the Connection, as someone later
  might want pagination and "extra crap", and add the array list there.

  ### Pagination
  Here you see pageInfo and edges properly implememted. Most situtations I've found myself
  in haven't needed pagination, so I've excluded it until needed. I still use the proper
  terminology, however, so that I can leave myself open to following this pattern in
  the future.
  """
  type BreedPhotosConnection {
    pageInfo: PageInfo!
    edges: [BreedPhotosEdge!]!
    images: [Image!]!
  }

  type BreedPhotosEdge {
    cursor: ID!
    node: Image!
  }

  """
  The Error type has to be the same across all  GraphQL applications,
  Eventually, I could this to be a truly shared type with an external library,
  but I haven't done that yet.
  """
  type Error {
    message: String!
    friendlyMessage: String
    """
    Once you identify a "code", make sure this NEVER EVER changes for a given cause. Having
    this code prevents you from having to do string matching on an error message, since error
    messages often change to clarify their meaning. The code should represent what's actually
    happened, and is meant to be string-matched against.
    """
    code: String!
  }

  """
  ## Objects as Scalars
  This is a good example of something that developers often put as a scalar. With an image,
  the client mostly just cares about the URL, so the developer will do "photo: String" or
  "photo: URL". This is "easy", but it doesn't leave you open to the idea that later you
  might want more information, like a title or a thumbnail url. Simply put, avoid using
  scalars (String, Int, URL) when you're really talking about an object. An image is not a
  string. A URL to an image might be, so "imageUrl: String" could be accurate if you really
  think you only want the scalar value.
  """
  type Image {
    url: String!
    title: String!
  }

  """
  MutationError won't usually exist, but I added it here to remind myself to include the
  clientMutationId and error on all Error payload types

  #### clientMutationId
  To follow the Relay spec, Mutation payloads must have the property clientMutationId, which
  MAY be nullable or non-nullable (just be consistent).
  """
  interface MutationError {
    clientMutationId: String
    error: Error!
  }

  interface MutationSuccess {
    """
    MutationSuccess won't usually exist, but I added it here to remind myself to include the
    clientMutationId on all success Payload types

    #### clientMutationId
    To follow the Relay spec, Mutation payloads must have the property clientMutationId, which
    MAY be nullable or non-nullable (just be consistent).
    """
    clientMutationId: String
  }

  """
  Some systems behind Platform API won't choose to implement the Node type for themselves,
  as this can be added at the Platform layer. If you do, these should all have a [Relay
  Node id](https://github.com/graphql/graphql-relay-js#object-identification)
  """
  interface Node {
    id: ID!
  }

  """
  ### Relay Pagination
  The relay spec [describes cursor-based paginatin](https://facebook.github.io/relay/graphql/connections.htm)
  as the method of pagination for all connection types. Per the spec, all connections
  MUST include this option, though I tend to leave a lot of those components out
  until they're expected by the client.
  @see [YAGNI](https://martinfowler.com/bliki/Yagni.html)
  """
  type PageInfo {
    hasPreviousPage: Boolean!
    hasNextPage: Boolean!
  }

  """
  ## Connections
  Almost always, instead of using an Array on a parent object, you should use a Connection.
  A Connection represents a join table as ParentChildrenConnection. If it is a top-level
  query, it isn't always obvious, but the Parent object is "Viewer", as the returned value
  is a list of the Children based on SOLELY the context of the "Viewer" or user.

  ### Connection Naming
  Connections should be named as <parent type (singular)> <child type (plural)> "Connection"
  """
  type ViewerBreedsConnection {
    """
    ### Relay Pagination
    You almost always want non-nullable parts in the actual array, and the array itself can be
    nullable or not, depending on what that represents in your data (or what it should represent
    for the client)
    """
    edges: [ViewerBreedsEdge!]!

    """
    Breeds are added here as a raw Array when the client wants to consume it without the join
    data points. It's generally easier than going down into the edges, and if they don't
    particularly care about the join data, they don't need to.
    """
    breeds: [Breed!]!
  }

  """
  ## Edges
  The Edge exists so that you can add additional metadata to the relationship
  between the Parent and the Child object or the Child object to the List

  ### Edge Naming
  Edges should be named as <parent type (singular)> <child type (plural)> "Edge"
  (This is the exact same as the Connection, but with the suffix changed)
  """
  type ViewerBreedsEdge {
    cursor: ID!
    node: Breed!
    favorited: Boolean!
  }

  """
  #### clientMutationId
  To follow the Relay spec, Mutation payloads must have the property clientMutationId, which
  MAY be nullable or non-nullable (just be consistent).
  """
  type ViewerSaveFavoriteBreedError implements MutationError {
    clientMutationId: String
    error: Error!
  }

  """
  #### input keyword
  For Mutation input types, instead of the keyword "type", you use the keyword "input".
  The name of the input should be the PascalCase version of the name of the Mutation, plus
  the word "Input" as a suffix.

  #### clientMutationId
  To follow the Relay spec, the Mutation input must have the property clientMutationId, which
  MAY be nullable or non-nullable (just be consistent).
  """
  input ViewerSaveFavoriteBreedInput {
    clientMutationId: String
    breedId: ID!
  }

  """
  #### Mutation Union payloads
  The name of Mutation Responses should be the PascalCase version of the name of the Mutation,
  plus the word "Payload" as a suffix.

  GraphQL doesn't (as of this writing) have a standard method of providing "good" error handling
  with mutations -- but I prefer to -- so I always build a Mutation Payload as a union type of
  an ...Error and a ...Success type
  """
  union ViewerSaveFavoriteBreedPayload = ViewerSaveFavoriteBreedError | ViewerSaveFavoriteBreedSuccess

  """
  ## Fat Queries
  I try to follow the "fat query" model, which describes mutations where you ask for
  what you want next as part of your Mutation response. The Mutation will usually change
  something, and you will want to see that change reflected in the data. This isn't
  something that the client should just "hope happened". It should be able to get back
  as solid a confirmation as necessary (what the data looks like now)

  #### clientMutationId
  To follow the Relay spec, the Mutation payload must have the property clientMutationId, which
  MAY be nullable or non-nullable (just be consistent).
  """
  type ViewerSaveFavoriteBreedSuccess implements MutationSuccess {
    clientMutationId: String
    breed: Breed!
    favorites: ViewerBreedsConnection!
  }
`;
