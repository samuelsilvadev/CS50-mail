export function sendEmailService({ body, onSuccess, onError, onSettled }) {
  return fetch("/emails", {
    method: "POST",
    body: JSON.stringify(body),
  })
    .then((response) => response.json())
    .then((response) => onSuccess(response))
    .catch((error) => onError(error))
    .finally(onSettled);
}
