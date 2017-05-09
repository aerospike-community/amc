import ls from 'local-storage';
import { toURLConverter } from './url';
import { postJSON } from './http';

const toURLPath = toURLConverter('auth');

export function authenticate(credentials) {
  const url = toURLPath('authenticate');
  return postJSON(url, {
      user: credentials.user,
      password: credentials.password
  }, false);
}
