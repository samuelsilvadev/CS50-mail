import { formatDate } from "./date-utils.js";
import { loadMailboxService, sendEmailService } from "./services.js";

document.addEventListener("DOMContentLoaded", function () {
  // Use buttons to toggle between views
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

  // By default, load the inbox
  load_mailbox("inbox");
});

function compose_email() {
  // Show compose view and hide other views
  document.querySelector("#emails-view").style.display = "none";
  document.querySelector("#compose-view").style.display = "block";

  // Clear out composition fields
  document.querySelector("#compose-recipients").value = "";
  document.querySelector("#compose-subject").value = "";
  document.querySelector("#compose-body").value = "";

  document
    .querySelector("#compose-view")
    .addEventListener("submit", send_email);
}

function load_mailbox(mailbox) {
  const emailsView = document.querySelector("#emails-view");

  // Show the mailbox and hide other views
  emailsView.style.display = "block";
  document.querySelector("#compose-view").style.display = "none";

  // Show the mailbox name
  emailsView.innerHTML = `<h3>${
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
      }

      const list = document.createElement("ul");
      list.classList.add("emails");
      list.appendChild(fragment);
      emailsView.appendChild(list);
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
