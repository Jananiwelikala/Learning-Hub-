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
