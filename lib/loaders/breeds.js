/**
 * Lib Files
 *
 * These files should be initialized and all dependencies injected
 * This makes testing much simpler.
 */
const config = require('config');

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
     * If this were an authenticated call, this would use the accessToken
     * and pass it along to the backing service, since the type of auth
     * would be server-specific)
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

  const load = async breedName => {
    const uri = `${baseUrl}/breed/${breedName}/images`;
    const { status } = await request(uri);

    if (status !== 'success') {
      return null;
    }

    return toModel(breedName);
  };

  const loadPhotos = async ({ breedName, limit }) => {
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
  };

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
    load,
    loadPhotos,
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
