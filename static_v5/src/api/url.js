const basePath = '/api/v1/';

export function toURLPath(path) {
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

export function toURLConverter(api) {
  api = removeLeadingSlash(api);
  api = removeTrailingSlash(api);

  return function(path) {
    path = removeLeadingSlash(path);
    const url = basePath + api + '/' + path;
    return removeTrailingSlash(url);
  }
}

