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
  return "Sorry kindly type correctly";
}

function selectContext(input) {
  const q = clean(input).toLowerCase();
  const context = {
    profile: {
      id: student.id,
      firstName: student.firstName,
      fullName: student.fullName,
      class: student.class,
      campus: student.campus,
    },
  };

  if (
    /mark|score|grade|result|perform|math|science|english|hindi|social/.test(q)
  )
    context.marks = student.marks;
  if (
    /notice|notification|announcement|unread|ptm|quiz|library|basketball/.test(
      q,
    )
  )
    context.notices = notices;
  if (/note|material|study|practice|chapter/.test(q)) context.notes = notes;
  if (/holiday|almanac|calendar|vacation|muharram|onam|independence/.test(q))
    context.holidays = holidays;
  if (/attendance|present|absent/.test(q))
    context.attendance = student.attendance;
  if (/task|assignment|due|worksheet|quiz|project/.test(q))
    context.tasks = tasks;
  if (/event|sports day|exam|ptm/.test(q)) context.events = events;
  if (/next class|timetable|schedule|room/.test(q))
    context.nextClass = student.nextClass;

  // General questions get all demo data so Athena can still answer naturally.
  if (Object.keys(context).length === 1)
    Object.assign(context, {
      attendance: student.attendance,
      nextClass: student.nextClass,
      marks: student.marks,
      notices,
      notes,
      holidays,
      tasks,
      events,
    });
  return context;
}

async function generateAnswer(input) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return localAnswer(input);

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6",
      max_tokens: 300,
      system:
        "You are Athena, EuroSchool's friendly Argus assistant. Answer only from supplied student context. Be concise, age-appropriate, and protect student privacy. If the answer is absent, say you sorry kindly type correctly",
      messages: [
        {
          role: "user",
          content: `Student context:\n${JSON.stringify(selectContext(input))}\n\nStudent question: ${clean(input)}`,
        },
      ],
    }),
  });
  if (!response.ok)
    throw new Error(`Anthropic API returned ${response.status}`);
  const result = await response.json();
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

module.exports = { answerQuestion, selectContext };
