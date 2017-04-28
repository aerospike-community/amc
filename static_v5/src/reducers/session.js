import { AUTHENTICATE_USER, USER_AUTHENTICATION_SUCCESS, USER_AUTHENTICATION_FAILURE } from '../actions/authenticate';

// the current session of the user
export default function session(state = {
    authentication: { // status of authentication
      inProgress: false,
      success: false,
      failureMessage: '',
    },
    user: { // currently logged in user
      name: '',
      password: '',
      roles: [],
    },
  }, action) {
  let auth, user;
  switch (action.type) {
    case AUTHENTICATE_USER:
      auth = Object.assign({}, state.authentication, {
        inProgress: true
      });
      return Object.assign({}, state, {
        authentication: auth
      });
    case USER_AUTHENTICATION_SUCCESS:
      auth = Object.assign({}, state.authentication, {
        inProgress: false,
        success: true,
      });
      user = {
        name: action.name,
        password: action.password,
        roles: action.roles
      };
      return Object.assign({}, state, {
        authentication: auth,
        user: user
      });
    case USER_AUTHENTICATION_FAILURE:
      auth = Object.assign({}, state.authentication, {
        inProgress: false,
        success: false,
        failureMessage: action.failureMessage,
      });
      user = {
        name: '',
        password: '',
        roles: []
      };
      return Object.assign({}, state, {
        authentication: auth,
        user: user
      });
    default:
      return state;
  }
}

