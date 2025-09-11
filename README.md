# Token Orchestrator API

A server capable of generating, assigning, and managing API keys with specific functionalities as outlined in the requirements.

## Features

- Generate and manage API keys
- Key expiration after 5 minutes of inactivity (keep-alive functionality)
- Block/unblock keys from being used
- Automatically remove keys that haven't been kept alive
- Retrieve key information (assignment timestamps, status)

## API Endpoints

### POST /keys: Generate new keys
- **Status:** 201 Created
- **Response:** `{"keyId": "<id>"}`

### GET /keys/:id: Retrieve an available key by client use
- **Status:** 200 OK / 404 Not Found
- **Response:** `{"keyId": "<id>", "key": "<key>"}`

### GET /keys/:id/info: Provide information about a specific key
- **Status:** 200 OK / 404 Not Found
- **Response:** 
```json
{
  "isBlocked": "<true|false>",
  "createdAt": "<timestamp>",
  "expiresAt": "<timestamp>",
  "lastActivity": "<timestamp>"
}
```

### DELETE /keys/:id: Remove a specific key from the system
- **Status:** 200 OK / 404 Not Found

### PUT /keys/:id: Unblock a key for further use
- **Status:** 200 OK / 404 Not Found
- **Request Body:** `{"blocked": false}`

### PUT /keys/:id/alive: Signal the server to keep the specified key alive
- **Status:** 200 OK / 404 Not Found

## Setup and Installation

1. Clone this repository
2. Install dependencies:
   ```
   npm install
   ```
3. Start the server:
   ```
   npm start
   ```
   For development with auto-restart:
   ```
   npm run dev
   ```

## Implementation Details

- **Key Generation:** Uses UUID v4 for both key ID and key value
- **Storage:** In-memory storage (would be replaced with a database in production)
- **Key Validation:** Checks if key exists, is not blocked, and has not expired
- **Keep-Alive Mechanism:** Keys with keep-alive functionality expire after 5 minutes of inactivity
- **Automatic Cleanup:** Background process removes expired keys every minute

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```
PORT=3000
```

## Dependencies

- express: Web server framework
- uuid: For generating unique IDs
- cors: Cross-Origin Resource Sharing middleware
- dotenv: Environment variable management
- nodemon (dev): Auto-restart during development
