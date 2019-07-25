/**
 * Lib Files
 *
 * These files should be initialized and all dependencies injected
 * This makes testing much simpler.
 */
const config = require('config');
const DataLoader = require('dataloader');

const baseUrl = config.get('dogApiUrl');

/**
 * initialize
 *
 * All `loaders` or any and all business-logic code should be
 * pre-initialized during the beginning of the request and curried
 * with the properties they need. This allows us to perform this
 * action either in direct-to-Lambda code or in the GraphQL context
 * setup function
 *
 * I have purposely excluded the word "context" here, as that has
 * become loaded. GraphQL has one, and Lambda has one, and this is
 * NEITHER OF THOSE, but these properties are what
 * this library needs to be able to work correctly
 */
// eslint-disable-next-line no-unused-vars
exports.initialize = ({ viewer, request }) => {
  const list = async filters => {
    const uri = `${baseUrl}/breeds/list`;
    const { fluffy = null, favorite = null } = filters;
    /**
     * Authentication is usually something that will change depending on
     * the service you are communicating with. That means you would likely
     * handle auth (accessToken vs whatever) in the loader (here), rather
     * than in the request library.
     *
     * @example
     * const options = {
     *   headers: {
     *     Authorization: `Bearer ${accessToken}`,
     *   },
     *   params: {
     *     filter: input.name,
     *   },
     * };
     *
     * const { message: breeds } = await request(uri, options);
     */

    const { message: breeds } = await request(uri);
    const mappedBreeds = breeds.map(toModel);

    if (fluffy !== null) {
      return mappedBreeds.filter(breed => {
        return breed.fluffy === fluffy;
      });
    }

    if (favorite !== null) {
      return mappedBreeds.filter(breed => {
        return breed.favorite === favorite;
      });
    }

    return mappedBreeds;
  };

  /**
   * Dataloaders
   *
   * Dataloader is used here to allow for caching on any given request.
   * If a client asks for the same information multiple times in a single
   * request, this allows it to be fulfilled a single time.
   *
   *
   * Note that we are creating the DataLoader inside the request context.
   * This caching is handled on a per-request basis, as the user's permissions
   * to access that data will change between users, and the backing system
   * determines what the access control rules are for any given user.
   */
  const breedLoader = new DataLoader(breedNames => {
    /**
     * CAVEAT: Promises
     *
     * Be careful here to make sure you're returning a Promise. You're doing
     * a `.map`, which returns an array of promises, not a single one, but
     * Dataloader expects a single promise that resolves with the array of results.
     * You must make sure you're either making the function `async` (which can
     * be strange if you're not using `await` anywhere in it) or you must return
     * Promise.all().
     */
    return Promise.all(breedNames.map(async breedName => {
      const uri = `${baseUrl}/breed/${breedName}/images`;
      const { status } = await request(uri);

      if (status !== 'success') {
        return null;
      }

      /**
       * Here I'm choosing to cache the pre-formatted breed. This isn't always
       * the correct option, as sometimes you need the raw request information,
       * but it was better in THIS case
       */
      return toModel(breedName);
    }));
  })

  /**
   * DataLoader on Object lookup
   *
   * This DataLoader shows A method of caching by an object lookup using the
   * cacheKeyFn method. I have chosen to do a JSON.stringify on the keys.
   *
   * CAVEAT: JSON.stringify
   *
   * You should not just `JSON.stringify` the incoming key, as this method does not
   * pre-order the properties before making the string.
   *
   * e.g.
   * JSON.stringify({ name: 'name', limit: 10 }) === '"{ name: 'name', limit: 10 }"'
   * JSON.stringify({ limit: 10, name: 'name' }) === '"{ limit: 10, name: 'name' }"'
   *
   * While you may expect the stringify of those two objects to be the same, they are
   * not, unless you pre-orer your keys yourself, as show in this example.
   */
  const photoLoaders = new DataLoader(async keys => {
    return Promise.all(keys.map(async ({ breedName, limit }) => {
      const uri = `${baseUrl}/breed/${breedName}/images`;
      const { status, message: photos } = await request(uri);

      if (status !== 'success') {
        return null;
      }

      return photos.slice(0, limit).map(url => {
        return {
          url,
          title: `Photo of ${breedName}`,
        };
      });
    }));
  }, {
    cacheKeyFn: key => {
      return JSON.stringify({
        name: key.breedName,
        limit: key.limit,
      });
    }
  });

  const makeFavorite = async breedName => {
    const uri = `${baseUrl}/breed/${breedName}/images`;
    const { status } = await request(uri);

    if (status !== 'success') {
      const err = new Error('Breed not found');

      err.code = 'ERR_BREED_NOT_FOUND';
      err.friendlyMessage = "I couldn't find that breed. Please check your ID and try again";
      throw err;
    }

    inMemoryFavorites.add(breedName);

    return breedName;
  };

  return {
    list,
    load: breedLoader.load.bind(breedLoader),
    loadPhotos: photoLoaders.load.bind(photoLoaders),
    makeFavorite,
  };
};

const fluffyDogs = ['husky', 'malamute', 'mastiff', 'sheepdog', 'poodle', 'shiba', 'samoyed'];

const favoriteDogs = ['cotondetulear', 'dalmation', 'malamute', 'pointer', 'wolfhound'];

const inMemoryFavorites = new Set();

const toModel = breedName => {
  const favorite = favoriteDogs.includes(breedName) || inMemoryFavorites.has(breedName);

  return {
    id: breedName,
    name: breedName,
    fluffy: fluffyDogs.includes(breedName),
    favorite,
  };
};
