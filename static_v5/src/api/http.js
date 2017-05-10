export function postJSON(url, data, processResponse = true) {
  const f = fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data)
  })
  return promise(f, processResponse);
}

export function get(url, processResponse = true) {
  const f = fetch(url, {
    method: 'GET',
  })
  return promise(f, processResponse);
}

export function deleteAPI(url, processResponse = true) {
  const f = fetch(url, {
    method: 'DELETE'
  });
  return promise(f, processResponse);
}

function promise(p, processResponse) {
  if (processResponse)
    return p.then((response) => resolveResponse(response));
  else
    return p;
}

function resolveResponse(response) {
  if (response.ok)
    return response.json();

  return new Promise((resolve, reject) => {
    response.text().then((message) => {
      reject(message)
    });
  });
}

