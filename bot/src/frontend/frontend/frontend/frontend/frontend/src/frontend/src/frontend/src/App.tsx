import React, { useState, useEffect } from 'react';
import { fetchPosts, createPost } from './api';

export default function App() {
  const [posts, setPosts] = useState<any[]>([]);
  const [content, setContent] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      const data = await fetchPosts();
      setPosts(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content || !scheduledTime) return;
    await createPost(content, scheduledTime);
    setContent('');
    setScheduledTime('');
    loadPosts();
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '600px', margin: '0 auto' }}>
      <h1>📅 Discord 予約投稿ポータル</h1>
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '30px' }}>
        <label>
          メッセージ内容:
          <textarea 
            value={content} 
            onChange={(e) => setContent(e.target.value)}
            style={{ width: '100%', height: '80px', marginTop: '5px' }}
          />
        </label>
        
        <label>
          送信日時:
          <input 
            type="datetime-local" 
            value={scheduledTime} 
            onChange={(e) => setScheduledTime(e.target.value)}
            style={{ display: 'block', marginTop: '5px', padding: '8px' }}
          />
        </label>

        <button type="submit" style={{ padding: '10px', backgroundColor: '#5865F2', color: '#fff', border: 'none', borderRadius: '5px' }}>
          予約を追加する
        </button>
      </form>

      <h2>予約一覧</h2>
      <ul>
        {posts.map((p) => (
          <li key={p.id} style={{ marginBottom: '10px', borderBottom: '1px solid #ccc', paddingBottom: '5px' }}>
            <strong>[{p.status}]</strong> {new Date(p.scheduledTime).toLocaleString('ja-JP')}<br />
            {p.content}
          </li>
        ))}
      </ul>
    </div>
  );
}
