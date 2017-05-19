import ls from 'local-storage';

import { authenticate as authenticateAPI } from '../api/auth';

export const AUTHENTICATE_USER = 'AUTHENTICATE_USER';
export const LOGOUT_USER = 'LOGOUT_USER';
export const USER_AUTHENTICATION_SUCCESS = 'USER_AUTHENTICATION_SUCCESS';
export const USER_AUTHENTICATION_FAILURE = 'USER_AUTHENTICATION_FAILURE';

let fetch = window.fetch;
const AuthHeader = 'Authorization';

export function init(dispatch) {
  const jwt = ls.get('jwt');
  const user = ls.get('user');
  if (jwt) {
    window.fetch = authorizedFetch(jwt, dispatch);
    dispatch(authSuccess(user)); // TODO user roles
  } else {
    dispatch(logoutUser());
  }
}

function authenticateUser(credentials) {
  return {
    type: AUTHENTICATE_USER,
  };
}

function authFailed() {
  return {
    type: USER_AUTHENTICATION_FAILURE,
    failureMessage: 'Authentication failure'
  };
}

function logoutUser() {
  return {
    type: LOGOUT_USER
  };
}

export function logout() {
  ls.clear();
  return logoutUser();
}

function authSuccess(user, roles = []) {
  return {
    type: USER_AUTHENTICATION_SUCCESS,
    user: user,
    roles: roles, // TODO fetch the user roles,
  };
}

export function authenticate(credentials) {
  return (dispatch) => {
    dispatch(authenticateUser(credentials));

    authenticateAPI(credentials)
      .then((response) => {
        const jwt = response.headers.get(AuthHeader);
        window.fetch = authorizedFetch(jwt, dispatch);
        ls.set('jwt', jwt);

        const user = credentials.user;
        ls.set('user', user);
        dispatch(authSuccess(user));
      })
      .catch((response) => {
          dispatch(authFailed()); // TODO error message
      });
  }
}

// fetch with the Authorization header inserted
// JSON Web Token authentication is used. see https://tools.ietf.org/html/rfc7519
function authorizedFetch(jwt, dispatch) {
  return (url, options = {}) => {
    let headers = options.headers || new Headers();

    if (headers instanceof Headers)
      headers.set(AuthHeader, jwt);
    else
      headers[AuthHeader] = jwt;

    options.headers = headers;

    return fetch(url, options)
      .then((response) => {
        if (response.status === 401) // unauthorized
          dispatch(logoutUser());

        return response; 
      });
  }
}
