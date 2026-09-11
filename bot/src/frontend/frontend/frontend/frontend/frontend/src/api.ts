const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

export async function fetchPosts() {
  const res = await fetch(`${API_BASE}/posts`);
  return res.json();
}

export async function createPost(content: string, scheduledTime: string) {
  const res = await fetch(`${API_BASE}/posts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, scheduledTime }),
  });
  return res.json();
}
