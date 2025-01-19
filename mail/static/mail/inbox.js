import { formatDate } from "./date-utils.js";
import {
  loadCountsService,
  loadEmailService,
  loadMailboxService,
  sendEmailService,
  updateEmailService,
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

  load_mailbox("inbox");
  pollAndDisplayCounts();
});

function compose_email({ recipients = "", subject = "", body = "" } = {}) {
  views.emails.hide();
  views.email.hide();
  views.compose.show();

  document.querySelector("#compose-recipients").value = recipients;
  document.querySelector("#compose-subject").value = subject;
  document.querySelector("#compose-body").value = body;

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
      showEmailSentSuccessfullyToast();
      form.reset();
      load_mailbox("sent");
    },
    onError: (error) => {
      const $errorMessage = document.querySelector('[data-id="error-message"]');
      const failureReason =
        error?.message ??
        error?.error ??
        "Something went wrong, try again later.";

      $errorMessage.textContent = failureReason;

      showEmailSentFailureToast();
    },
    onSettled: () => {
      setTimeout(() => {
        form.removeAttribute("data-loading");
        submitButton.removeAttribute("disabled");
      }, 500);
    },
  });
}

function loadEmail(emailId) {
  views.compose.hide();
  views.emails.hide();
  views.email.show();

  loadEmailService({
    id: emailId,
    onSuccess: (email) => {
      document.querySelector('[data-id="from"]').textContent = email.sender;
      document.querySelector('[data-id="to"]').textContent =
        email.recipients.join(",");
      document.querySelector('[data-id="subject"]').textContent = email.subject;
      document.querySelector('[data-id="timestamp"]').textContent = formatDate(
        email.timestamp
      );
      document.querySelector('[data-id="body"]').textContent = email.body;

      if (!email.read) {
        updateEmailService({ id: emailId, body: { read: true } });
      }

      const $unArchiveButton = document.querySelector(
        '[data-id="btn-unarchive"]'
      );
      const $archiveButton = document.querySelector('[data-id="btn-archive"]');
      const $replyButton = document.querySelector('[data-id="reply"]');

      $unArchiveButton.style.display = email.archived ? "inline-block" : "none";
      $archiveButton.style.display = email.archived ? "none" : "inline-block";

      const handleUnArchive = () => {
        $unArchiveButton.setAttribute("disabled", "true");
        updateEmailService({
          id: emailId,
          body: { archived: false },
          onSuccess: () => {
            $unArchiveButton.style.display = "none";
            $unArchiveButton.removeEventListener("click", handleUnArchive);

            $archiveButton.style.display = "inline-block";
            $archiveButton.addEventListener("click", handleArchive);
            load_mailbox("inbox");
          },
          onSettled: () => {
            $unArchiveButton.removeAttribute("disabled");
          },
        });
      };

      const handleArchive = () => {
        $archiveButton.setAttribute("disabled", "true");
        updateEmailService({
          id: emailId,
          body: { archived: true },
          onSuccess: () => {
            $archiveButton.style.display = "none";
            $archiveButton.removeEventListener("click", handleArchive);

            $unArchiveButton.style.display = "inline-block";
            $unArchiveButton.addEventListener("click", handleUnArchive);
            load_mailbox("inbox");
          },
          onSettled: () => {
            $archiveButton.removeAttribute("disabled");
          },
        });
      };

      const handleReply = () => {
        load_reply(email);
      };

      $unArchiveButton.addEventListener("click", handleUnArchive);
      $archiveButton.addEventListener("click", handleArchive);
      $replyButton.addEventListener("click", handleReply);

      const observer = new MutationObserver((mutationsList) => {
        mutationsList.forEach((mutation) => {
          if (
            mutation.type === "attributes" &&
            mutation.attributeName === "style" &&
            views.email.target.style.display === "none"
          ) {
            $unArchiveButton.removeEventListener("click", handleUnArchive);
            $archiveButton.removeEventListener("click", handleArchive);
            $replyButton.removeEventListener("click", handleReply);
            observer.disconnect();
          }
        });
      });

      observer.observe(views.email.target, {
        attributes: true,
        attributeFilter: ["style"],
      });
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

function normalizeSubject(subject) {
  if (subject?.toLowerCase()?.replaceAll(" ", "")?.startsWith("re:")) {
    return subject;
  }

  return `Re: ${subject ?? ""}`;
}

function prepareBodyReply(email) {
  return `On ${email.timestamp} ${email.sender} wrote:
  
  ${email.body}
  `;
}

function load_reply(email) {
  compose_email({
    recipients: email.sender,
    subject: normalizeSubject(email.subject),
    body: prepareBodyReply(email),
  });
}

function showEmailSentSuccessfullyToast() {
  const successEmailToast = document.getElementById("email-sent-success");
  const toastBootstrap = bootstrap.Toast.getOrCreateInstance(successEmailToast);
  toastBootstrap.show();
}

function showEmailSentFailureToast() {
  const failureEmailToast = document.getElementById("email-sent-failure");
  const toastBootstrap = bootstrap.Toast.getOrCreateInstance(failureEmailToast);
  toastBootstrap.show();
}

function loadCountsAndDisplayCounts() {
  loadCountsService({
    onSuccess: (response) => {
      document.querySelector('[data-id="inbox-count"]').textContent =
        response.inbox;
      document.querySelector('[data-id="sent-count"]').textContent =
        response.sent;
      document.querySelector('[data-id="archived-count"]').textContent =
        response.archived;
    },
  });
}

function createPollingForCounts() {
  return setInterval(() => {
    loadCountsAndDisplayCounts();
  }, 5000);
}

function pollAndDisplayCounts() {
  loadCountsAndDisplayCounts();

  let intervalId = createPollingForCounts();

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      clearInterval(intervalId);
    } else {
      intervalId = createPollingForCounts();
    }
  });
}
