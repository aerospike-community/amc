const basePath = '/api/v1/';

export const toURLPath = (path) => {
  path = removeLeadingSlash(path);
  return basePath + path;
}

function removeLeadingSlash(path) {
  if (path.startsWith('/'))
    path = path.slice('/'.length)

  return path;
}

function removeTrailingSlash(path) {
  if (path.endsWith('/'))
    path = path.slice(0, -1 * '/'.length);

  return path;
}

export const toURLConverter = (api) => {
  api = removeLeadingSlash(api);
  api = removeTrailingSlash(api);

  return (path) => {
    path = removeLeadingSlash(path);
    const url = basePath + api + '/' + path;
    return removeTrailingSlash(url);
  }
}

