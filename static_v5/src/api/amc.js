import { toURLConverter } from './url';
import { get } from './http';

const toURLPath = toURLConverter('amc');

export function system() {
  const url = toURLPath('system');
  return get(url);
}

