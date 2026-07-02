const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const escapeHtml = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[character],
  );

let data;

function showScreen(name) {
  $$(".screen").forEach((screen) => {
    screen.classList.toggle("active", screen.id === `screen-${name}`);
  });

  $$(".nav-item").forEach((item) => {
    item.classList.toggle("active", item.dataset.screen === name);
  });

  history.replaceState(null, "", `#${name}`);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderHome() {
  $("#studentName").textContent = `${data.student.firstName} 👋`;
  $("#athenaBrief").innerHTML = data.athenaBrief
    .map((item) => `<li>${escapeHtml(item)}</li>`)
    .join("");

  $("#homeNotices").innerHTML = data.notices
    .slice(0, 3)
    .map(
      (notice) => `
        <article class="home-notice">
          <div class="meta">
            <i>${escapeHtml(notice.initials)}</i>
            <span>${escapeHtml(notice.teacher)} · ${escapeHtml(notice.date)}</span>
          </div>
          <h3>${escapeHtml(notice.title)}</h3>
          <div class="action"><strong>Action:</strong> ${escapeHtml(notice.action)}</div>
        </article>`,
    )
    .join("");

  $("#homeNotes").innerHTML = data.notes
    .slice(0, 4)
    .map(
      (note) => `
        <article class="mini-note">
          <div class="subject-label">
            <i class="subject-dot" style="background:${note.color}"></i>
            ${escapeHtml(note.subject)}
          </div>
          <h3>${escapeHtml(note.title)}</h3>
          <p>${escapeHtml(note.teacher)} · ${escapeHtml(note.date)}</p>
          <button class="outline-btn">↓ Download</button>
        </article>`,
    )
    .join("");
}

function renderNotices() {
  $("#noticeBoard").innerHTML = data.notices
    .map(
      (notice) => `
        <article class="notice-card">
          <div class="notice-card-head">
            <div class="teacher-avatar">${escapeHtml(notice.initials)}</div>
            <div>
              <h3>${escapeHtml(notice.title)}</h3>
              <div class="meta">${escapeHtml(notice.teacher)} · ${escapeHtml(notice.date)}</div>
            </div>
            <span class="tag">${escapeHtml(notice.category)}</span>
          </div>
          <p>${escapeHtml(notice.body)}</p>
          <div class="notice-actions">
            <div class="action"><strong>Action:</strong> ${escapeHtml(notice.action)}</div>
            <button class="outline-btn">▱ ${escapeHtml(notice.attachment)}</button>
          </div>
        </article>`,
    )
    .join("");
}

function renderCalendar() {
  const cells = [];

  for (let day = 1; day <= 30; day += 1) {
    const date = `2026-06-${String(day).padStart(2, "0")}`;
    const event = data.events.find((item) => item.date === date);
    const weekday = (day - 1) % 7;

    cells.push(`
      <div class="day ${weekday > 4 ? "weekend" : ""} ${day === 25 ? "today" : ""}">
        <span class="number">${day}</span>
        ${event ? `<div class="event-chip" title="${escapeHtml(event.title)}">${escapeHtml(event.title)}</div>` : ""}
      </div>`);
  }

  $("#calendarGrid").innerHTML = cells.join("");
  $("#julyEvents").innerHTML = data.events
    .filter((event) => event.date.startsWith("2026-07"))
    .map(
      (event) => `
        <div class="july-event">
          <strong>${Number(event.date.slice(-2))} Jul</strong> · ${escapeHtml(event.title)}
        </div>`,
    )
    .join("");
}

function renderNotes(filter = "All") {
  const subjects = [
    "All",
    "English",
    "Business Studies",
    "Accountancy",
    "Economics",
    "Applied Maths",
  ];
  $("#noteFilters").innerHTML = subjects
    .map(
      (subject) =>
        `<button class="${subject === filter ? "active" : ""}" data-filter="${subject}">${subject}</button>`,
    )
    .join("");

  const notes =
    filter === "All"
      ? data.notes
      : data.notes.filter((note) => note.subject === filter);
  $("#notesGrid").innerHTML = notes
    .map(
      (note) => `
        <article class="note-card" style="--accent:${note.color}">
          <div class="subject-label">
            <i class="subject-dot" style="background:${note.color}"></i>
            ${escapeHtml(note.subject)}
          </div>
          <h3>${escapeHtml(note.title)}</h3>
          <p>${escapeHtml(note.teacher)} · Uploaded ${escapeHtml(note.date)}</p>
          <div class="note-card-actions">
            <button class="outline-btn">↓ Download</button>
            <button class="outline-btn bookmark ${note.bookmarked ? "active" : ""}" data-note="${note.id}">
              ${note.bookmarked ? "★" : "☆"} Bookmark
            </button>
          </div>
        </article>`,
    )
    .join("");
}

function renderTasks(filter = "All") {
  const filters = ["All", "Pending", "Overdue", "Submitted"];
  $("#taskFilters").innerHTML = filters
    .map(
      (item) =>
        `<button class="${item === filter ? "active" : ""}" data-filter="${item}">${item}</button>`,
    )
    .join("");

  const tasks =
    filter === "All"
      ? data.tasks
      : data.tasks.filter((task) => task.status === filter);
  $("#taskList").innerHTML = tasks.length
    ? tasks
        .map(
          (task) => `
            <div class="task-row">
              <div class="task-title">
                <i class="subject-dot" style="background:${task.color}"></i>
                <div><b>${escapeHtml(task.title)}</b><small>${escapeHtml(task.subject)}</small></div>
              </div>
              <span class="type-badge">${escapeHtml(task.type)}</span>
              <span class="due">Due ${escapeHtml(task.due)}</span>
              <span class="status-badge">${escapeHtml(task.status)}</span>
            </div>`,
        )
        .join("")
    : `<div class="task-row">No ${filter.toLowerCase()} tasks.</div>`;
}

function setDrawer(open) {
  $("#athenaDrawer").classList.toggle("open", open);
  $("#drawerBackdrop").classList.toggle("open", open);
  $("#athenaDrawer").setAttribute("aria-hidden", String(!open));
  document.body.classList.toggle("drawer-open", open);
  if (open) setTimeout(() => $("#messageInput").focus(), 250);
}

function addMessage(text, type) {
  const message = document.createElement("div");
  message.className = `message ${type}`;
  message.innerHTML = `${escapeHtml(text)}<time>${new Date().toLocaleTimeString(
    [],
    {
      hour: "2-digit",
      minute: "2-digit",
    },
  )}</time>`;
  $("#messages").append(message);
  $("#messages").scrollTop = $("#messages").scrollHeight;
}

function showWelcome() {
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  $("#messages").innerHTML = "";
  addMessage(
    `${greeting}, ${data.student.firstName}! I’m Athena ✨\n\nI can untangle notices, plan around deadlines, find notes, and make sense of your school day. What’s on your mind?`,
    "bot",
  );
}

function updateAiStatus() {
  const isLive = Boolean(data.ai?.enabled);
  $("#aiStatus").textContent = isLive
    ? `● Generative AI · ${data.ai.model}`
    : "● Smart local mode · Add an API key for GenAI";
  $("#aiStatus").classList.toggle("live", isLive);
  $("#drawerAiStatus").textContent = isLive ? "Claude live" : "Local mode";
  $("#drawerAiStatus").classList.toggle("live", isLive);
}

async function ask(message) {
  if (!message.trim()) return;
  addMessage(message, "user");
  $("#messageInput").value = "";

  const typing = document.createElement("div");
  typing.className = "message bot typing";
  typing.innerHTML = "<i></i><i></i><i></i>";
  $("#messages").append(typing);

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });
    const result = await response.json();
    typing.remove();
    addMessage(result.reply || "Something went wrong.", "bot");
  } catch {
    typing.remove();
    addMessage("I can’t reach Argus right now. Please try again.", "bot");
  }
}

document.addEventListener("click", (event) => {
  const navigation = event.target.closest(".nav-item,.go-screen");
  if (navigation) showScreen(navigation.dataset.screen);
  if (event.target.closest(".open-athena")) setDrawer(true);
  if (
    event.target.closest("#closeAthena") ||
    event.target.id === "drawerBackdrop"
  )
    setDrawer(false);
  if (event.target.closest("#clearChat")) showWelcome();

  const noteFilter = event.target.closest("#noteFilters button");
  if (noteFilter) renderNotes(noteFilter.dataset.filter);
  const taskFilter = event.target.closest("#taskFilters button");
  if (taskFilter) renderTasks(taskFilter.dataset.filter);

  const bookmark = event.target.closest(".bookmark");
  if (bookmark) {
    const note = data.notes.find(
      (item) => item.id === Number(bookmark.dataset.note),
    );
    note.bookmarked = !note.bookmarked;
    renderNotes($("#noteFilters .active")?.dataset.filter || "All");
  }

  const suggestion = event.target.closest("#suggestions button");
  if (suggestion) ask(suggestion.textContent.replace(/^[^\w]+/, ""));
});

$("#chatForm").addEventListener("submit", (event) => {
  event.preventDefault();
  ask($("#messageInput").value);
});

$("#messageInput").addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    $("#chatForm").requestSubmit();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") setDrawer(false);
});

async function init() {
  try {
    data = await fetch("/api/dashboard").then((response) => response.json());
    renderHome();
    renderNotices();
    renderCalendar();
    renderNotes();
    renderTasks();
    $("#navBadge").textContent = data.unreadCount;
    updateAiStatus();
    showWelcome();
    showScreen(location.hash.slice(1) || "home");
  } catch {
    $("main").innerHTML =
      "<p>Argus data is unavailable. Start the Node server and refresh.</p>";
  }
}

init();
