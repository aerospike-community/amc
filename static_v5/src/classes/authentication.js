import ls from 'local-storage';

let jwt;
let fetch = window.fetch;
export const AuthHeader = 'Authorization';

function init() {
  jwt = ls.get('jwt');
  if (jwt)
    window.fetch = authorizedFetch;
}
init();

export function clearAuthentication() {
  jwt = null;
  ls.clear();
  window.fetch = fetch;
}

export function setAuthentication(jsonWebToken, user) {
  jwt = jsonWebToken;
  window.fetch = authorizedFetch;
  ls.set('jwt', jwt);
  ls.set('user', user);
}

export function getUser() {
  return ls.get('user');
}

// fetch with the Authorization header inserted
function authorizedFetch(url, options) {
  let headers;
  options = options || {};
  if (options && options.headers) 
    headers = options.headers;
  else
    headers = new Headers();

  if (headers instanceof Headers) 
    headers.set(AuthHeader, jwt);
  else 
    headers[AuthHeader] = jwt;

  if (!options.headers) 
    options.headers = headers;

  return fetch(url, options);
}

