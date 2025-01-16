import { formatDate } from "./date-utils.js";
import { loadMailboxService, sendEmailService } from "./services.js";
import { View } from "./view.js";

const views = {
  emails: View.create("#emails-view"),
  compose: View.create("#compose-view"),
};

document.addEventListener("DOMContentLoaded", function () {
  document
    .querySelector("#inbox")
    .addEventListener("click", () => load_mailbox("inbox"));
  document
    .querySelector("#sent")
    .addEventListener("click", () => load_mailbox("sent"));
  document
    .querySelector("#archived")
    .addEventListener("click", () => load_mailbox("archive"));
  document.querySelector("#compose").addEventListener("click", compose_email);

  load_mailbox("inbox");
});

function compose_email() {
  views.emails.hide();
  views.compose.show();

  // Clear out composition fields
  document.querySelector("#compose-recipients").value = "";
  document.querySelector("#compose-subject").value = "";
  document.querySelector("#compose-body").value = "";

  document
    .querySelector("#compose-view")
    .addEventListener("submit", send_email);
}

function load_mailbox(mailbox) {
  views.emails.show();
  views.compose.hide();

  views.emails.target.innerHTML = `<h3>${
    mailbox.charAt(0).toUpperCase() + mailbox.slice(1)
  }</h3>`;

  loadMailboxService({
    id: mailbox,
    onSuccess: (emails) => {
      const fragment = document.createDocumentFragment();

      for (const email of emails) {
        const listItem = document.createElement("li");
        const sender = document.createElement("span");
        sender.textContent = email.sender;

        const subject = document.createElement("span");
        subject.textContent = email.subject;

        const timestamp = document.createElement("span");
        timestamp.textContent = formatDate(email.timestamp);

        listItem.appendChild(sender);
        listItem.appendChild(subject);
        listItem.appendChild(timestamp);
        fragment.appendChild(listItem);

        if (email.read) {
          listItem.classList.add("read");
        }
      }

      const list = document.createElement("ul");
      list.classList.add("emails");
      list.appendChild(fragment);
      views.emails.target.appendChild(list);
    },
  });
}

function send_email(event) {
  event.preventDefault();

  const form = event.target;
  const submitButton = document.querySelector("#submit-button");

  form.setAttribute("data-loading", true);
  submitButton.setAttribute("disabled", true);

  const formData = new FormData(form);
  const subject = formData.get("subject");
  const body = formData.get("body");
  const recipients = formData.get("recipients");

  sendEmailService({
    body: {
      subject,
      body,
      recipients,
    },
    onSuccess: () => {
      setTimeout(() => {
        form.removeAttribute("data-loading");
        submitButton.removeAttribute("disabled");
        form.reset();
      }, 500);
    },
    onError: () => {},
  });
}
