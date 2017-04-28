import * as url from './url';

const fetch = window.fetch;

let jwt;
const AuthHeader = 'Authorization';
const toURLPath = url.toURLConverter('auth');

export function authenticate(credentials) {
  const url = toURLPath('authenticate');
  return fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      user: credentials.user,
      password: credentials.password
    })
  })
  .then(function(response) {
    if (response.ok) {
      jwt = response.headers.get(AuthHeader);
      window.fetch = authorizedFetch;
    }
    return response;
  });
}

export function logout() {
  jwt = null;
  window.fetch = fetch;
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

