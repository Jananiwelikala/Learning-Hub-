// Base URL comes from frontend/.env (REACT_APP_API_BASE_URL).
const BASE_URL = process.env.REACT_APP_API_BASE_URL;

// Builds default JSON headers and includes JWT if user is logged in.
function getAuthHeaders() {
  const token = localStorage.getItem("token");
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

// Creates a new user account.
export async function register(data) {
  const res = await fetch(`${BASE_URL}/api/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

// Authenticates user and returns JWT token.
export async function login(data) {
  const res = await fetch(`${BASE_URL}/api/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

// Fetches stream list (token is attached when available).
export async function getStreams() {
  const res = await fetch(`${BASE_URL}/api/streams`, {
    headers: getAuthHeaders(),
  });
  return res.json();
}

// Fetches subject list (token is attached when available).
export async function getSubjects() {
  const res = await fetch(`${BASE_URL}/api/subjects`, {
    headers: getAuthHeaders(),
  });
  return res.json();
}

// Fetches subjects by stream when streamId is provided.
export async function getSubjectsByStream(streamId) {
  const query = streamId ? `?streamId=${encodeURIComponent(streamId)}` : "";
  const res = await fetch(`${BASE_URL}/api/subjects${query}`, {
    headers: getAuthHeaders(),
  });
  return res.json();
}

// Fetches lessons for a subject.
export async function getLessons(subjectId) {
  const query = subjectId ? `?subjectId=${encodeURIComponent(subjectId)}` : "";
  const res = await fetch(`${BASE_URL}/api/lessons${query}`, {
    headers: getAuthHeaders(),
  });
  return res.json();
}

// Fetches full lesson details (includes resources).
export async function getLessonDetails(lessonId) {
  const res = await fetch(`${BASE_URL}/api/lessons/${lessonId}`, {
    headers: getAuthHeaders(),
  });
  return res.json();
}

// Fetches MCQs for a lesson.
export async function getMcqs(lessonId) {
  const res = await fetch(
    `${BASE_URL}/api/mcqs?lessonId=${encodeURIComponent(lessonId)}`,
    {
      headers: getAuthHeaders(),
    }
  );
  return res.json();
}

// Submits MCQ answers and returns graded result.
export async function submitMcqs(payload) {
  const res = await fetch(`${BASE_URL}/api/mcqs/submit`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  return res.json();
}
