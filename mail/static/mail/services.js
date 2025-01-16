export function sendEmailService({ body, onSuccess, onError, onSettled }) {
  return fetch("/emails", {
    method: "POST",
    body: JSON.stringify(body),
  })
    .then((response) => response.json())
    .then((response) => onSuccess?.(response))
    .catch((error) => onError?.(error))
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
        let parsedResponse = {};

        try {
          parsedResponse = await response.json();
        } catch {}

        onSuccess?.(parsedResponse);
      }
    })
    .catch((error) => onError?.(error))
    .finally(onSettled);
}
