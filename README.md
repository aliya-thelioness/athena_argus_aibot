# Athena — EuroSchool’s Personal Argus AI

Athena is an AI assistant embedded in the Argus learning ecosystem. It gives every student a private, personalised view of their school day and helps them understand their own notices, notes, tasks, marks, attendance, timetable, and almanac.

The current demo contains one student profile, Rohit. In production, every authenticated student would receive a separate Athena experience using only the data connected to their own Argus account. A student must never be able to access another student’s information.

This currently uses rule-based machine learning but it has the code to be implement generatve AI as well so we just need an api key of the chatbots like OPENAI and CLAUDE and we are all set.

Also note- the backen of Athena currently has the information of only one student and will be able to implement more once more student information is loaded onto the page. 

## Features

- Personalised greeting and daily Athena briefing
- Unread notice count and notice summaries
- AI-extracted action items from school notices
- Recent class notes with subject filters and bookmarks
- Assignment and task tracking by status and due date
- School almanac with events, exams, sports days, and PTMs
- Student-specific marks, attendance, profile, and next-class answers
- Suggested questions and conversational chat interface
- Local NLP responses when no generative-AI key is configured
- Claude-powered natural answers when Anthropic is enabled
- Automatic fallback to local NLP if the AI service is unavailable
- WhatsApp Business support through Meta’s Cloud API webhook
- Responsive desktop and mobile interface
- Server-side API-key handling so private credentials are never exposed to the browser

## How Athena Works

1. A student signs in to Argus or messages EuroSchool’s WhatsApp Business number.
2. The backend identifies the authenticated student.
3. The student’s question is sent to Athena’s Node.js backend.
4. Athena’s NLP routing detects whether the question concerns notices, notes, tasks, marks, attendance, timetable, profile, or calendar events.
5. The backend retrieves only the minimum information required from that student’s Argus profile.
6. If generative AI is enabled, the question and relevant context are sent securely to Claude. Otherwise, Athena answers through its local NLP rules.
7. Claude is instructed to answer only from the supplied Argus information and to say when information is unavailable or doesnt exist.
8. The backend returns Athena’s answer to the Argus chat drawer or sends it through Meta to the student’s WhatsApp conversation.

```text
Student question
      ↓
Authenticated Argus or WhatsApp user
      ↓
Athena Node.js backend
      ↓
NLP topic detection
      ↓
Only that student’s relevant Argus data
      ↓
Local NLP or Claude
      ↓
Personalised answer in Argus or WhatsApp
```

Athena does not store a separate copy of every student’s information inside the AI model. Argus remains the trusted source of student data, and the backend retrieves current information when a question is asked. The production version should enforce authentication, phone-number verification, per-student access controls, data minimisation, encryption, audit logging, and school privacy policies.
