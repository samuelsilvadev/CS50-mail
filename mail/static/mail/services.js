async function toJSON(response) {
  let parsedResponse = null;

  try {
    parsedResponse = await response.json();
  } catch {}

  return parsedResponse;
}

export function sendEmailService({ body, onSuccess, onError, onSettled }) {
  return fetch("/emails", {
    method: "POST",
    body: JSON.stringify(body),
  })
    .then(async (response) => {
      if (response.ok) {
        onSuccess?.(await toJSON(response));
      }

      throw response;
    })
    .catch(async (error) => {
      const parsedError = await toJSON(error);

      onError?.(parsedError ?? error);
    })
    .finally(onSettled);
}

export function loadMailboxService({ id, onSuccess, onError, onSettled }) {
  return fetch(`/emails/${id}`, {
    method: "GET",
  })
    .then((response) => response.json())
    .then((response) => onSuccess?.(response))
    .catch((error) => onError?.(error))
    .finally(onSettled);
}

export function loadEmailService({ id, onSuccess, onError, onSettled }) {
  return fetch(`/emails/${id}`, {
    method: "GET",
  })
    .then((response) => response.json())
    .then((response) => onSuccess?.(response))
    .catch((error) => onError?.(error))
    .finally(onSettled);
}

export function updateEmailService({
  id,
  body,
  onSuccess,
  onError,
  onSettled,
}) {
  return fetch(`/emails/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  })
    .then(async (response) => {
      if (response.ok) {
        onSuccess?.(await toJSON(response));
      }
    })
    .catch((error) => onError?.(error))
    .finally(onSettled);
}
