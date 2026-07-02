const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");
const {
  student,
  notices,
  notes,
  holidays,
  tasks,
  events,
  athenaBrief,
} = require("./data");
const { answerQuestion } = require("./assistant");

loadEnv();
const PORT = Number(process.env.PORT || 3000);
const PUBLIC = path.join(__dirname, "public");
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
};

function loadEnv() {
  try {
    fs.readFileSync(path.join(__dirname, ".env"), "utf8")
      .split(/\r?\n/)
      .forEach((line) => {
        const match = line.match(/^\s*([^#=]+)=(.*)$/);
        if (match && !process.env[match[1].trim()])
          process.env[match[1].trim()] = match[2].trim();
      });
  } catch (_) {}
}

function json(res, status, body) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
  });
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
      if (data.length > 1e6) req.destroy();
    });
    req.on("end", () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (e) {
        reject(e);
      }
    });
  });
}

async function sendWhatsApp(to, message) {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneId) {
    console.log(`[WhatsApp demo] To ${to}: ${message}`);
    return { demo: true };
  }
  const version = process.env.WHATSAPP_API_VERSION || "v21.0";
  const response = await fetch(
    `https://graph.facebook.com/${version}/${phoneId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: message },
      }),
    },
  );
  if (!response.ok) throw new Error(`WhatsApp API failed: ${response.status}`);
  return response.json();
}

async function api(req, res, url) {
  if (req.method === "GET" && url.pathname === "/api/dashboard")
    return json(res, 200, {
      student,
      notices,
      notes,
      holidays,
      tasks,
      events,
      athenaBrief,
      unreadCount: notices.filter((n) => n.unread).length,
      ai: {
        provider: "Anthropic",
        enabled: Boolean(process.env.ANTHROPIC_API_KEY),
        model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6",
      },
    });
  if (req.method === "POST" && url.pathname === "/api/chat") {
    try {
      const body = await readBody(req);
      return json(res, 200, {
        reply: await answerQuestion(body.message),
        timestamp: new Date().toISOString(),
      });
    } catch (_) {
      return json(res, 400, { error: "Please send valid JSON." });
    }
  }
  if (
    req.method === "POST" &&
    /^\/api\/notices\/\d+\/read$/.test(url.pathname)
  ) {
    const item = notices.find(
      (n) => n.id === Number(url.pathname.split("/")[3]),
    );
    if (!item) return json(res, 404, { error: "Notice not found" });
    item.unread = false;
    return json(res, 200, {
      notice: item,
      unreadCount: notices.filter((n) => n.unread).length,
    });
  }
  if (req.method === "GET" && url.pathname === "/webhooks/whatsapp") {
    const valid =
      url.searchParams.get("hub.mode") === "subscribe" &&
      url.searchParams.get("hub.verify_token") ===
        process.env.WHATSAPP_VERIFY_TOKEN;
    if (valid) {
      res.writeHead(200);
      return res.end(url.searchParams.get("hub.challenge"));
    }
    return json(res, 403, { error: "Webhook verification failed" });
  }
  if (req.method === "POST" && url.pathname === "/webhooks/whatsapp") {
    json(res, 200, { received: true });
    try {
      const body = await readBody(req);
      const msg = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
      if (msg?.type === "text")
        await sendWhatsApp(msg.from, await answerQuestion(msg.text.body));
    } catch (error) {
      console.error("WhatsApp webhook:", error.message);
    }
    return;
  }
  return false;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/webhooks/")
  ) {
    const handled = await api(req, res, url);
    if (handled === false && !res.writableEnded)
      json(res, 404, { error: "Not found" });
    return;
  }
  const requested =
    url.pathname === "/"
      ? "index.html"
      : decodeURIComponent(url.pathname.slice(1));
  const file = path.resolve(PUBLIC, requested);
  if (!file.startsWith(path.resolve(PUBLIC))) {
    res.writeHead(403);
    return res.end("Forbidden");
  }
  fs.readFile(file, (err, content) => {
    if (err) {
      res.writeHead(404);
      return res.end("Not found");
    }
    res.writeHead(200, {
      "Content-Type": MIME[path.extname(file)] || "application/octet-stream",
    });
    res.end(content);
  });
});

server.listen(PORT, () => {
  console.log(`Athena is ready at http://localhost:${PORT}`);
  console.log(
    `[Demo student] ${student.fullName} · ${student.class} · Attendance ${student.attendance}%`,
  );
  console.log(
    `[Latest marks] ${student.marks.map((m) => `${m.subject}: ${m.score}/${m.total}`).join(" | ")}`,
  );
  console.log(
    `[Notice board] ${notices.filter((n) => n.unread).length} unread · ${notices.map((n) => n.title).join(" | ")}`,
  );
});
