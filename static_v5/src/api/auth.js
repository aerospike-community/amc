import ls from 'local-storage';
import { toURLConverter } from './url';
import { AuthHeader, setAuthentication } from '../classes/authentication';

const toURLPath = toURLConverter('auth');

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
      const jwt = response.headers.get(AuthHeader);
      setAuthentication(jwt, credentials.user);
    }
    return response;
  });
}
