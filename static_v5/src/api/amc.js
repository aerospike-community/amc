import { toURLConverter } from './url';

const toURLPath = toURLConverter('amc');

export function system() {
  const url = toURLPath('system');
  return fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

