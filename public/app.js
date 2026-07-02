const $ = (s) => document.querySelector(s);
const chat = $("#chat"),
  messages = $("#messages"),
  input = $("#messageInput");
const escapeHtml = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );

function addMessage(text, type) {
  const el = document.createElement("div");
  el.className = `message ${type}`;
  el.innerHTML = `${escapeHtml(text)}<time>${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</time>`;
  messages.append(el);
  messages.scrollTop = messages.scrollHeight;
}

function setChat(open) {
  chat.classList.toggle("open", open);
  chat.setAttribute("aria-hidden", String(!open));
  $("#athenaLauncher").style.display = open ? "none" : "flex";
  if (open) setTimeout(() => input.focus(), 250);
}
$("#athenaLauncher").onclick = () => setChat(true);
$("#close").onclick = () => setChat(false);
$("#minimize").onclick = () => setChat(false);

async function ask(message) {
  if (!message.trim()) return;
  addMessage(message, "user");
  input.value = "";
  const typing = document.createElement("div");
  typing.className = "message bot typing";
  typing.innerHTML = "<i></i><i></i><i></i>";
  messages.append(typing);
  messages.scrollTop = messages.scrollHeight;
  try {
    const r = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });
    const data = await r.json();
    typing.remove();
    addMessage(data.reply || "Something went wrong.", "bot");
  } catch (_) {
    typing.remove();
    addMessage(
      "I can’t reach Argus right now. Please try again in a moment.",
      "bot",
    );
  }
}
$("#chatForm").onsubmit = (e) => {
  e.preventDefault();
  ask(input.value);
};
input.onkeydown = (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    $("#chatForm").requestSubmit();
  }
};
$("#suggestions").onclick = (e) => {
  if (e.target.tagName === "BUTTON") ask(e.target.textContent);
};

async function loadDashboard() {
  try {
    const d = await fetch("/api/dashboard").then((r) => r.json());
    $("#noticeCount").textContent = `${d.unreadCount} new`;
    $("#headerBadge").textContent = d.unreadCount;
    $("#chatBadge").textContent = d.unreadCount;
    $("#noticeList").innerHTML = d.notices
      .map(
        (n) =>
          `<div class="notice ${n.unread ? "" : "read"}" data-id="${n.id}"><i class="notice-dot"></i><div class="item-main"><b>${escapeHtml(n.title)}</b><span>${escapeHtml(n.date)} · ${escapeHtml(n.body)}</span></div><small class="tag">${escapeHtml(n.category)}</small></div>`,
      )
      .join("");
    $("#notesList").innerHTML = d.notes
      .map(
        (n) =>
          `<div class="note"><span class="note-icon ${n.color}">▤</span><div class="item-main"><b>${escapeHtml(n.title)}</b><span>${escapeHtml(n.subject)} · ${escapeHtml(n.teacher)}</span><small>Updated ${escapeHtml(n.updated)}</small></div><button class="download" aria-label="Open note">↗</button></div>`,
      )
      .join("");
    $("#holidayList").innerHTML = d.holidays
      .map((h) => {
        const [day, month] = h.date.split(" ");
        return `<div class="holiday"><div class="datebox"><strong>${day}</strong>${month.slice(0, 3).toUpperCase()}</div><div class="item-main"><b>${escapeHtml(h.name)}</b><span>${escapeHtml(h.day)} · ${escapeHtml(h.type)}</span></div></div>`;
      })
      .join("");
    $("#noticeList").onclick = async (e) => {
      const row = e.target.closest(".notice");
      if (!row || row.classList.contains("read")) return;
      const x = await fetch(`/api/notices/${row.dataset.id}/read`, {
        method: "POST",
      }).then((r) => r.json());
      row.classList.add("read");
      $("#noticeCount").textContent = `${x.unreadCount} new`;
      $("#headerBadge").textContent = x.unreadCount;
      $("#chatBadge").textContent = x.unreadCount;
    };
  } catch (_) {
    $("#noticeList").innerHTML =
      "<p>Dashboard data is temporarily unavailable.</p>";
  }
}
addMessage(
  "Good morning, Rohit! 👋\n\nI’m Athena, your personal Argus assistant. You have 3 unread notices today. How can I help?",
  "bot",
);
loadDashboard();
