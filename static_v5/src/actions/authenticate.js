import ls from 'local-storage';

import { toURLConverter } from 'api/url';
import { authenticate as authenticateAPI, isAuthURL } from 'api/auth';
import { disconnectCluster, displayAuthClusterConnection } from 'actions/clusters';

export const AUTHENTICATE_USER = 'AUTHENTICATE_USER';
export const LOGOUT_USER = 'LOGOUT_USER';
export const USER_AUTHENTICATION_SUCCESS = 'USER_AUTHENTICATION_SUCCESS';
export const USER_AUTHENTICATION_FAILURE = 'USER_AUTHENTICATION_FAILURE';

const Fetch = window.fetch;
const AuthHeader = 'Authorization';
const AMCUnreachable = 'Failed to fetch';

export function init(dispatch) {
  const jwt = ls.get('jwt');
  const user = ls.get('user');
  if (jwt) {
    window.fetch = authorizedFetch(jwt, dispatch);
    dispatch(authSuccess(user)); // TODO user roles
  } else {
    dispatch(logout());
  }
}

function authenticateUser(credentials) {
  return {
    type: AUTHENTICATE_USER,
  };
}

function authFailed(msg) {
  return {
    type: USER_AUTHENTICATION_FAILURE,
    failureMessage: msg || 'Authentication failure'
  };
}

export function logout() {
  ls.clear();
  window.fetch = Fetch;

  return {
    type: LOGOUT_USER
  };
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
        let { message } = response;
        if (message === AMCUnreachable)
          message = 'AMC server unreachable';
        dispatch(authFailed(message)); 
        throw message;
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

    return Fetch(url, options)
      .then((response) => {
        if (response.status === 401) // unauthorized
          dispatch(logout());

        if (response.status === 400)  
          process400(url, response, dispatch);

        return response; 
      })
      .catch((err) => {
        let msg = err.message;
        // some unknown network error.
        // Maybe network unavailability.
        if (msg === AMCUnreachable && !isAuthURL(url)) {
          dispatch(logout());
          msg = 'AMC server unreachable';
        }
        throw msg;
      });
  }
}

// process a HTTP response with status 400
function process400(url, response, dispatch) {
  // the original text function
  const textFn = response.text;

  // Calling text on response more than once is an error.
  // So filling the response with a promise object that resolves
  // to the original text.
  let resolve;
  response.text = function() {
    return new Promise((r) => {
      resolve = r;
    });
  };

  textFn.call(response).then((message) => {
    // cluster not polled for some time
    // show cluster connect dialog
    if (message.indexOf('Cluster Not Found') !== -1) {
      const clusterID = extractClusterID(url);
      dispatch(disconnectCluster(clusterID));
      dispatch(displayAuthClusterConnection(true, clusterID));
    }

    // resolving text promise
    resolve(message);
  });
}

// extract cluster id from the url
function extractClusterID(url) {
  const prefix = toURLConverter('connections')(''); // Ex: '/api/v1/connections'
  
  const s = url.slice(prefix.length + '/'.length);
  return s.split('/')[0];
}
