import { toURLConverter } from 'api/url';
import { get } from 'api/http';

const toURLPath = toURLConverter('amc');

export function system() {
  const url = toURLPath('system');
  return get(url);
}

