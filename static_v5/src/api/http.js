export function postJSON(url, data, processResponseAsJSON = true) {
  const f = fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data)
  })
  return promise(f, processResponseAsJSON);
}

export function get(url, processResponseAsJSON = true) {
  const f = fetch(url, {
    method: 'GET',
  })
  return promise(f, processResponseAsJSON);
}

export function deleteAPI(url, processResponseAsJSON = true) {
  const f = fetch(url, {
    method: 'DELETE'
  });
  return promise(f, processResponseAsJSON);
}

function promise(p, processResponseAsJSON) {
  if (processResponseAsJSON)
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

