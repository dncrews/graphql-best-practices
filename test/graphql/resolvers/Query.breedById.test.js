const { resolvers } = require('../../../graphql/resolvers');
const resolver = resolvers.Query.breedById;

test('id may not be an empty string', () => {
  expect(() => {
    return resolver(null, { id: '' });
  }).toThrowError('breedById requires an ID to be provided');
});
test('id will be base64 decoded and separated', () => {
  const breedName = `${Math.random()}`;
  const expectedResponse = { id: breedName, name: breedName, fluffy: true, favorite: true };
  const loader = jest.fn(() => expectedResponse);

  const id = Buffer.from(`Dog:${breedName}`).toString('base64');

  const result = resolver(null, { id }, { loaders: { breeds: { load: loader } } });
  expect(loader).toBeCalledWith(breedName);
  expect(result).toBe(expectedResponse);
});
