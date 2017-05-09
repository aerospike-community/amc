import queryString from 'query-string';

const basePath = '/api/v1/';

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

// returns a function which converts the api and path to 
// a complete url
export function toURLConverter(api) {
  api = removeLeadingSlash(api);
  api = removeTrailingSlash(api);

  // return url for path, queryParams
  return (path, queryParams = {}) => {
    path = removeLeadingSlash(path);

    let url = basePath + api + '/' + path;
    url = removeTrailingSlash(url);

    let qparams = queryString.stringify(queryParams);
    if (qparams.length > 0)
      url += '?' + qparams;

    return url;
  }
}

