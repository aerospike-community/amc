import queryString from 'query-string';
import { removeTrailingSlash, removeLeadingSlash } from '../classes/util';

const basePath = '/api/v1/';

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

