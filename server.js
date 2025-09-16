const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = 3001;

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

let events = [];

app.get('/api/events', (req, res) => {
  res.json(events);
});

app.post('/api/events', (req, res) => {
  const { title, start, end, color } = req.body;
  if (!title || !start || !end || !color) {
    return res.status(400).json({ error: 'Missing fields' });
  }
  events.push({ title, start, end, color });
  res.status(201).json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
