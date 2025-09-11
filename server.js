const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory storage for keys
// In a production environment, this would be a database
const keys = {};

// Key management functions
const generateKey = () => {
  const id = uuidv4();
  const key = uuidv4();
  const createdAt = Date.now();
  
  keys[id] = {
    id,
    key,
    createdAt,
    blocked: false,
    lastActivity: createdAt,
    expiresAt: null // Default to no expiration
  };
  
  return { id, key };
};

const isKeyValid = (id) => {
  const keyData = keys[id];
  
  if (!keyData) return false;
  if (keyData.blocked) return false;
  
  // Check if key has expired
  if (keyData.expiresAt && Date.now() > keyData.expiresAt) {
    return false;
  }
  
  return true;
};

// Automatically remove keys that haven't been kept alive
setInterval(() => {
  const now = Date.now();
  Object.keys(keys).forEach(id => {
    const keyData = keys[id];
    
    // If key has keep-alive functionality and hasn't been signaled in 5 minutes
    if (keyData.expiresAt && (now - keyData.lastActivity > 5 * 60 * 1000)) {
      delete keys[id];
    }
  });
}, 60 * 1000); // Check every minute

// Endpoints

// POST /keys: Generate new keys
app.post('/keys', (req, res) => {
  const { id, key } = generateKey();
  res.status(201).json({ "keyId": id });
});

// GET /keys/:id: Retrieve an available key by client use
app.get('/keys/:id', (req, res) => {
  const { id } = req.params;
  const keyData = keys[id];
  
  if (!keyData) {
    return res.status(404).json({ error: 'Key not found' });
  }
  
  if (!isKeyValid(id)) {
    return res.status(403).json({ error: 'Key is blocked or expired' });
  }
  
  res.status(200).json({ "keyId": id, "key": keyData.key });
});

// GET /keys/:id: Provide information about a specific key
app.get('/keys/:id/info', (req, res) => {
  const { id } = req.params;
  const keyData = keys[id];
  
  if (!keyData) {
    return res.status(404).json({ error: 'Key not found' });
  }
  
  // Format timestamps for better readability
  const createdAt = new Date(keyData.createdAt).toISOString();
  const expiresAt = keyData.expiresAt ? new Date(keyData.expiresAt).toISOString() : 'never';
  const lastActivity = new Date(keyData.lastActivity).toISOString();
  
  res.status(200).json({
    "isBlocked": keyData.blocked,
    "createdAt": createdAt,
    "expiresAt": expiresAt,
    "lastActivity": lastActivity
  });
});

// DELETE /keys/:id: Remove a specific key from the system
app.delete('/keys/:id', (req, res) => {
  const { id } = req.params;
  
  if (!keys[id]) {
    return res.status(404).json({ error: 'Key not found' });
  }
  
  delete keys[id];
  res.status(200).json({ message: 'Key deleted successfully' });
});

// PUT /keys/:id: Block a key for further use
app.put('/keys/:id', (req, res) => {
  const { id } = req.params;
  const { blocked } = req.body;
  
  if (!keys[id]) {
    return res.status(404).json({ error: 'Key not found' });
  }
  
  if (typeof blocked !== 'boolean') {
    return res.status(400).json({ error: 'Invalid request. "blocked" field must be a boolean' });
  }
  
  keys[id].blocked = blocked;
  res.status(200).json({ message: `Key ${blocked ? 'blocked' : 'unblocked'} successfully` });
});

// PUT /keys/:id/alive: Signal the server to keep the specified key alive
app.put('/keys/:id/alive', (req, res) => {
  const { id } = req.params;
  
  if (!keys[id]) {
    return res.status(404).json({ error: 'Key not found' });
  }
  
  if (!isKeyValid(id)) {
    return res.status(403).json({ error: 'Key is blocked or expired' });
  }
  
  // Update last activity timestamp
  keys[id].lastActivity = Date.now();
  
  // If key doesn't have an expiration yet, set it to expire in 5 minutes
  // This implements the keep-alive functionality
  if (!keys[id].expiresAt) {
    keys[id].expiresAt = Date.now() + (5 * 60 * 1000); // 5 minutes
  } else {
    // Extend expiration by 5 minutes from now
    keys[id].expiresAt = Date.now() + (5 * 60 * 1000);
  }
  
  res.status(200).json({ message: 'Key keep-alive signal received' });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Token Orchestrator API running on port ${PORT}`);
});