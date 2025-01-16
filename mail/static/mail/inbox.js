import { formatDate } from "./date-utils.js";
import {
  loadEmailService,
  loadMailboxService,
  sendEmailService,
} from "./services.js";
import { View } from "./view.js";

const views = {
  emails: View.create("#emails-view"),
  compose: View.create("#compose-view"),
  email: View.create("#email-view"),
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
  document.querySelector("#compose").addEventListener("click", loadEmail);

  load_mailbox("inbox");
});

function compose_email() {
  views.emails.hide();
  views.email.hide();
  views.compose.show();

  // Clear out composition fields
  document.querySelector("#compose-recipients").value = "";
  document.querySelector("#compose-subject").value = "";
  document.querySelector("#compose-body").value = "";

  document
    .querySelector("#compose-form")
    .addEventListener("submit", send_email);
}

function load_mailbox(mailbox) {
  views.compose.hide();
  views.email.hide();
  views.emails.show();

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

        listItem.setAttribute("data-email-id", email.id);
        listItem.setAttribute("role", "button");
        listItem.setAttribute(
          "aria-label",
          `Click to see details about the email from ${email.sender} with the subject ${email.subject}`
        );
      }

      const list = document.createElement("ul");
      list.classList.add("emails");
      list.setAttribute("data-id", "emails");
      list.appendChild(fragment);
      views.emails.target.appendChild(list);

      addListenerOnEmails();
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

function loadEmail(emailId) {
  views.compose.hide();
  views.emails.hide();
  views.email.show();

  loadEmailService({
    id: emailId,
    onSuccess: (email) => {
      console.log(email);

      document.querySelector('[data-id="from"]').textContent = email.sender;
      document.querySelector('[data-id="to"]').textContent =
        email.recipients.join(",");
      document.querySelector('[data-id="subject"]').textContent = email.subject;
      document.querySelector('[data-id="timestamp"]').textContent = formatDate(
        email.timestamp
      );
      document.querySelector('[data-id="body"]').textContent = email.body;
    },
  });
}

function addListenerOnEmails() {
  const $emails = document.querySelector("[data-id='emails']");

  const navigateToEmail = (event) => {
    const emailId = event.target.closest("li")?.dataset?.emailId;

    loadEmail(emailId);
  };

  $emails.addEventListener("click", navigateToEmail);
}
