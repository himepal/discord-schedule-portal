import express from 'express';
import cors from 'cors';
import session from 'express-session';
import cron from 'node-cron';
import webpush from 'web-push';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

app.use(session({
  secret: process.env.SESSION_SECRET || 'secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));

// VAPID 設定 (Web Push用)
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:example@example.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

// 簡易メモリDB
let pushSubscriptions: any[] = [];
let scheduledPosts: any[] = [];

// API: VAPID Public Key取得
app.get('/api/push/vapid-public-key', (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
});

// API: Push通知の購読登録
app.post('/api/push/subscribe', (req, res) => {
  const subscription = req.body;
  pushSubscriptions.push(subscription);
  res.status(201).json({ message: 'Subscribed successfully.' });
});

// API: 予約投稿の一覧取得
app.get('/api/posts', (req, res) => {
  res.json(scheduledPosts);
});

// API: 予約投稿の新規作成
app.post('/api/posts', (req, res) => {
  const { content, scheduledTime } = req.body;
  const newPost = {
    id: Date.now().toString(),
    content,
    scheduledTime,
    status: 'pending'
  };
  scheduledPosts.push(newPost);
  res.status(201).json(newPost);
});

// 1分ごとにチェックする定時実行処理（Cron）
cron.schedule('* * * * *', async () => {
  const now = new Date();
  for (const post of scheduledPosts) {
    if (post.status === 'pending' && new Date(post.scheduledTime) <= now) {
      post.status = 'sent';
      
      // Web Push 通知の送信
      const payload = JSON.stringify({
        title: '📅 予約投稿完了',
        body: `メッセージが送信されました: "${post.content.substring(0, 20)}..."`
      });

      pushSubscriptions.forEach(sub => {
        webpush.sendNotification(sub, payload).catch(err => console.error(err));
      });
    }
  }
});

// Botからの投稿受付用内部API
app.post('/api/posts/internal/bot-post', (req, res) => {
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== process.env.BOT_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { content, channelId } = req.body;
  console.log(`[Bot Action] Channel: ${channelId}, Content: ${content}`);
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
