import ls from 'local-storage';
import { toURLConverter } from './url';

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
}
