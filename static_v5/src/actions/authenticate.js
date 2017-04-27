export const AUTHENTICATE_USER = 'AUTHENTICATE_USER';
export const USER_AUTHENTICATION_SUCCESS = 'USER_AUTHENTICATION_SUCCESS';
export const USER_AUTHENTICATION_FAILURE = 'USER_AUTHENTICATION_FAILURE';

function authenticateUser(credentials) {
  return {
    type: AUTHENTICATE_USER,
  };
}

function successfulAuthentication(credentials, headers) {
  const jwt = headers.get('Authorization');
  return {
    type: USER_AUTHENTICATION_SUCCESS,
    user: credentials.user,
    password: credentials.password,
    roles: [], // TODO fetch the user roles,
    jwt: jwt,
  };
}

function failedAuthentication() {
  return {
    type: USER_AUTHENTICATION_FAILURE,
    failureMessage: 'Authentication failure'
  };
}

export function authenticate(credentials) {
  return function(dispatch) {
    dispatch(authenticateUser(credentials));

    // FIXME abstract out the API calls
    fetch('/api/v1/auth/authenticate', {
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
      if (response.ok) 
        dispatch(successfulAuthentication(credentials, response.headers));
        else
          dispatch(failedAuthentication());
    });
  }
}


