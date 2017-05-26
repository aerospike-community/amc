import ls from 'local-storage';
import { toURLConverter } from 'api/url';
import { postJSON } from 'api/http';

const toURLPath = toURLConverter('auth');

export function authenticate(credentials) {
  const url = toURLPath('authenticate');
  return postJSON(url, {
      user: credentials.user,
      password: credentials.password
  }, false);
}
