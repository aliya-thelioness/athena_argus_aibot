const { student, notices, notes, holidays, tasks, events } = require("./data");

const clean = (text) => String(text || "").trim();
const list = (items) => items.join("\n");

function localAnswer(input) {
  const q = clean(input).toLowerCase();
  if (!q)
    return "Ask me anything about your school day, marks, notices, notes or holidays.";
  if (/hello|hi|hey|namaste/.test(q))
    return `Hi ${student.firstName}! 👋 I’m Athena. What would you like to know about school today?`;
  if (/mark|score|grade|result|perform/.test(q)) {
    const subject = student.marks.find((m) =>
      q.includes(m.subject.toLowerCase()),
    );
    if (subject)
      return `You scored ${subject.score}/${subject.total} in ${subject.subject} (${subject.grade}). That’s ${subject.trend} points from your previous assessment.`;
    return `Here are your latest marks:\n${list(student.marks.map((m) => `• ${m.subject}: ${m.score}/${m.total} (${m.grade})`))}\nYour average is ${Math.round(student.marks.reduce((a, m) => a + m.score, 0) / student.marks.length)}%.`;
  }
  if (/notice|notification|announcement|unread/.test(q)) {
    const unread = notices.filter((n) => n.unread);
    return `You have ${unread.length} unread notices:\n${list(unread.map((n) => `• ${n.title} — ${n.body}`))}`;
  }
  if (/note|material|study/.test(q))
    return `Your recent study notes are:\n${list(notes.map((n) => `• ${n.subject}: ${n.title} (${n.updated})`))}`;
  if (/holiday|almanac|calendar|vacation/.test(q))
    return `Your next school holidays are:\n${list(holidays.map((h) => `• ${h.name} — ${h.date} (${h.day})`))}`;
  if (/task|assignment|due|worksheet|quiz|project/.test(q))
    return `Your upcoming tasks are:\n${list(tasks.map((t) => `• ${t.title} — due ${t.due} (${t.status})`))}`;
  if (/event|sports day|exam/.test(q))
    return `Your upcoming events are:\n${list(events.map((e) => `• ${e.title} — ${e.date}`))}`;
  if (/attendance|present|absent/.test(q))
    return `Your current attendance is ${student.attendance}%. You’re comfortably above the recommended 90% mark.`;
  if (/next class|timetable|schedule/.test(q))
    return `Your next class is ${student.nextClass.subject} at ${student.nextClass.time} in ${student.nextClass.room}.`;
  if (/who am i|profile|my details|student/.test(q))
    return `You’re ${student.fullName}, ${student.class} at ${student.campus}. Your student ID is ${student.id}.`;
  if (/help|what can you/.test(q))
    return "I can help with your marks, attendance, notices, recent notes, upcoming holidays, profile and next class. Try asking “How did I do in maths?”";
  return "I couldn’t find that in your Argus information. I can help with marks, attendance, notices, notes, tasks, classes, and school events. Try asking me about one of those.";
}

const STUDENT_DATA_TOOL = {
  name: "get_student_data",
  description:
    "Retrieve only the authenticated student's Argus information needed to answer the question. Select the smallest relevant set of categories.",
  input_schema: {
    type: "object",
    properties: {
      categories: {
        type: "array",
        description: "The student data categories required for the answer.",
        items: {
          type: "string",
          enum: [
            "profile",
            "marks",
            "attendance",
            "notices",
            "notes",
            "tasks",
            "events",
            "holidays",
            "next_class",
          ],
        },
        minItems: 1,
        uniqueItems: true,
      },
    },
    required: ["categories"],
    additionalProperties: false,
  },
};

function getStudentData(categories = []) {
  const allowed = new Set(categories);
  const result = {};

  if (allowed.has("profile")) {
    result.profile = {
      id: student.id,
      firstName: student.firstName,
      fullName: student.fullName,
      class: student.class,
      campus: student.campus,
    };
  }
  if (allowed.has("marks")) result.marks = student.marks;
  if (allowed.has("attendance")) result.attendance = student.attendance;
  if (allowed.has("notices")) result.notices = notices;
  if (allowed.has("notes")) result.notes = notes;
  if (allowed.has("tasks")) result.tasks = tasks;
  if (allowed.has("events")) result.events = events;
  if (allowed.has("holidays")) result.holidays = holidays;
  if (allowed.has("next_class")) result.nextClass = student.nextClass;

  return result;
}

async function callClaude(apiKey, body) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(
      `Anthropic API returned ${response.status}: ${details.slice(0, 200)}`,
    );
  }

  return response.json();
}

async function generateAnswer(input) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return localAnswer(input);

  const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";
  const system =
    "You are Athena, EuroSchool's friendly Argus assistant. First understand the student's question, then use get_student_data to request only the minimum Argus data needed. Never invent school or student information. Answer concisely and age-appropriately. If the question is unrelated to Argus or the tool result does not contain the answer, respond exactly: I couldn’t find that in your Argus information. I can help with marks, attendance, notices, notes, tasks, classes, and school events. Try asking me about one of those.";
  const messages = [{ role: "user", content: clean(input) }];

  const planningResponse = await callClaude(apiKey, {
    model,
    max_tokens: 300,
    system,
    tools: [STUDENT_DATA_TOOL],
    tool_choice: { type: "any" },
    messages,
  });

  const toolUses = planningResponse.content.filter(
    (block) => block.type === "tool_use" && block.name === "get_student_data",
  );

  if (!toolUses.length) {
    return (
      planningResponse.content
        .filter((block) => block.type === "text")
        .map((block) => block.text)
        .join("\n") || localAnswer(input)
    );
  }

  messages.push({ role: "assistant", content: planningResponse.content });
  messages.push({
    role: "user",
    content: toolUses.map((toolUse) => ({
      type: "tool_result",
      tool_use_id: toolUse.id,
      content: JSON.stringify(getStudentData(toolUse.input.categories)),
    })),
  });

  const result = await callClaude(apiKey, {
    model,
    max_tokens: 400,
    system,
    tools: [STUDENT_DATA_TOOL],
    tool_choice: { type: "none" },
    messages,
  });

  return (
    result.content
      ?.filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("\n") || localAnswer(input)
  );
}

async function answerQuestion(input) {
  try {
    return await generateAnswer(input);
  } catch (error) {
    console.error("Athena AI fallback:", error.message);
    return localAnswer(input);
  }
}

module.exports = { answerQuestion, getStudentData };
