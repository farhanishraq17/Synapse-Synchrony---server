# 🤖 AI Integration Guide - Whoop AI with Groq

## Overview
Your Synapse-Synchrony server now supports AI-powered chat responses using Groq's LLaMA 3.3 70B model.

---

## 🔧 Setup

### 1. Add GROQ_API_KEY to .env
```env
# Add this to your .env file
GROQ_API_KEY=your_groq_api_key_here
```

Get your free API key from: https://console.groq.com/keys

### 2. Update Files

**Replace these files:**
- `src/controllers/MessageController.js` → Use `MessageController-WITH-AI.js`
- `src/routes/ChatRoutes.js` → Use `ChatRoutes-WITH-AI.js`

### 3. Whoop AI User
The AI user is already created (you ran the seed script). Verify with:
```bash
# In MongoDB or your app
User.findOne({ isAI: true })
```

Should return:
```json
{
  "_id": "...",
  "name": "Whoop AI",
  "email": "WhopAI@gmail.com",
  "isAI": true,
  "avatar": "https://res.cloudinary.com/dp9vvlndo/image/upload/v1759925671/ai_logo_qqman8.png"
}
```

---

## 📡 New API Endpoints

### 1. Send Message to AI
**Endpoint:** `POST /api/chat/send-ai-message`

**Headers:**
```
Authorization: Bearer <jwt_token>
Cookie: token=<jwt_token>
```

**Request Body:**
```json
{
  "content": "What is JavaScript?",
  "chatId": "optional_existing_chat_id"
}
```

**Response:**
```json
{
  "error": false,
  "message": "AI response generated successfully",
  "data": {
    "userMessage": {
      "_id": "...",
      "content": "What is JavaScript?",
      "sender": { "_id": "...", "name": "User Name", "avatar": "..." },
      "chatId": "...",
      "createdAt": "..."
    },
    "aiMessage": {
      "_id": "...",
      "content": "JavaScript is a programming language...",
      "sender": { "_id": "...", "name": "Whoop AI", "avatar": "..." },
      "chatId": "...",
      "replyTo": "...", // Links to userMessage
      "createdAt": "..."
    },
    "chat": {
      "_id": "...",
      "participants": ["user_id", "ai_id"]
    }
  }
}
```

**Error Responses:**
- `400` - Message content is required
- `404` - Chat not found or unauthorized
- `500` - AI service unavailable / Internal server error

---

### 2. Get or Create AI Chat
**Endpoint:** `GET /api/chat/ai-chat`

**Headers:**
```
Authorization: Bearer <jwt_token>
Cookie: token=<jwt_token>
```

**Response:**
```json
{
  "error": false,
  "message": "AI chat retrieved successfully",
  "data": {
    "_id": "chat_id",
    "participants": [
      { "_id": "user_id", "name": "User Name", "avatar": "..." },
      { "_id": "ai_id", "name": "Whoop AI", "avatar": "..." }
    ],
    "lastMessage": { ... },
    "isGroup": false,
    "createdBy": "user_id",
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

---

## 🔄 How It Works

### Message Flow:

1. **User sends message:**
   ```
   POST /api/chat/send-ai-message
   { "content": "Hello AI!" }
   ```

2. **Server creates user message:**
   - Creates Message document with user as sender
   - Saves to database
   - Emits via Socket.IO to chat room

3. **Server calls Groq AI:**
   - Sends user's content to Groq API
   - Uses LLaMA 3.3 70B model
   - Waits for AI response

4. **Server creates AI message:**
   - Creates Message document with Whoop AI as sender
   - Links to user message via `replyTo`
   - Saves to database
   - Emits via Socket.IO to chat room

5. **Both messages appear in real-time:**
   - User message shows immediately
   - AI response follows (usually 1-3 seconds)
   - Both emit Socket.IO events for real-time updates

---

## 🎯 Frontend Integration

### Example: React Hook

```javascript
// hooks/use-ai-chat.js
import { useMutation, useQuery } from '@tanstack/react-query';
import { axiosInstance } from '@/lib/axios';

export const useAIChat = () => {
  // Get or create AI chat
  const { data: aiChat, isLoading } = useQuery({
    queryKey: ['ai-chat'],
    queryFn: async () => {
      const response = await axiosInstance.get('/chat/ai-chat');
      return response.data.data;
    },
  });

  // Send message to AI
  const sendAIMessage = useMutation({
    mutationFn: async (content) => {
      const response = await axiosInstance.post('/chat/send-ai-message', {
        content,
        chatId: aiChat?._id,
      });
      return response.data.data;
    },
  });

  return {
    aiChat,
    isLoading,
    sendAIMessage: sendAIMessage.mutate,
    isGenerating: sendAIMessage.isPending,
  };
};
```

### Example: Component

```javascript
function AIChatComponent() {
  const { aiChat, sendAIMessage, isGenerating } = useAIChat();
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;
    sendAIMessage(input, {
      onSuccess: () => setInput(''),
    });
  };

  return (
    <div>
      {/* Messages display */}
      <div className="messages">
        {messages.map(msg => (
          <div key={msg._id}>
            {msg.sender.name}: {msg.content}
          </div>
        ))}
      </div>

      {/* Input */}
      <input 
        value={input}
        onChange={(e) => setInput(e.target.value)}
        disabled={isGenerating}
      />
      <button onClick={handleSend} disabled={isGenerating}>
        {isGenerating ? 'AI is thinking...' : 'Send'}
      </button>
    </div>
  );
}
```

---

## ⚡ Features

### ✅ Automatic Chat Creation
- If user doesn't have a chat with AI, it's created automatically
- Returns chat ID for future messages

### ✅ Message Linking
- AI responses are linked to user messages via `replyTo`
- Shows context in the UI

### ✅ Real-Time Updates
- Both user and AI messages emit Socket.IO events
- Updates appear instantly in all connected clients

### ✅ Error Handling
- Rate limit retry with exponential backoff (1s, 2s, 4s)
- Service unavailable retry logic
- Fallback error messages
- Detailed console logging

### ✅ Groq Model Configuration
```javascript
{
  model: 'llama-3.3-70b-versatile',
  temperature: 0.7,        // Creative but coherent
  max_tokens: 2000,        // Long responses allowed
  top_p: 1,
  stream: false            // Wait for complete response
}
```

---

## 🔍 Testing

### Using cURL:

```bash
# 1. Get AI chat
curl -X GET http://localhost:3001/api/chat/ai-chat \
  -H "Cookie: token=YOUR_JWT_TOKEN"

# 2. Send message to AI
curl -X POST http://localhost:3001/api/chat/send-ai-message \
  -H "Content-Type: application/json" \
  -H "Cookie: token=YOUR_JWT_TOKEN" \
  -d '{
    "content": "Explain quantum computing in simple terms"
  }'
```

### Using Postman:

1. **Get AI Chat:**
   - Method: GET
   - URL: `http://localhost:3001/api/chat/ai-chat`
   - Auth: Cookie with JWT token

2. **Send AI Message:**
   - Method: POST
   - URL: `http://localhost:3001/api/chat/send-ai-message`
   - Auth: Cookie with JWT token
   - Body (JSON):
     ```json
     {
       "content": "Hello AI!"
     }
     ```

---

## 🐛 Troubleshooting

### Error: "AI service not available"
**Cause:** Whoop AI user not found in database  
**Fix:** Run the seed script again:
```bash
node src/script/SeedWhopAI.js
```

### Error: "Rate limit exceeded"
**Cause:** Too many Groq API requests  
**Fix:** Wait a moment, the retry logic will handle it automatically (1s, 2s, 4s delays)

### Error: "Service unavailable (503)"
**Cause:** Groq API temporarily down  
**Fix:** Automatic retry with exponential backoff

### No AI response
**Check:**
1. GROQ_API_KEY is set in .env
2. Console logs for errors
3. Network connectivity
4. Groq API status

---

## 📊 Rate Limits

**Groq Free Tier:**
- Requests: 30 requests/minute
- Tokens: 6,000 tokens/minute
- Daily: 14,400 requests/day

**Handling:**
- Automatic retry on 429 errors
- Exponential backoff (1s → 2s → 4s)
- Max 3 retry attempts

---

## 🚀 Production Considerations

### Before Deploying:

1. **Rate Limiting:**
   ```javascript
   // Add to server.js
   import rateLimit from 'express-rate-limit';
   
   const aiMessageLimiter = rateLimit({
     windowMs: 60 * 1000, // 1 minute
     max: 10, // 10 messages per minute per user
   });
   
   router.post('/send-ai-message', aiMessageLimiter, VerifyToken, SendAIMessage);
   ```

2. **Message Queue:**
   - Consider Bull/BullMQ for handling AI requests
   - Prevents server blocking during AI generation

3. **Caching:**
   - Cache common AI responses (Redis)
   - Reduces API costs and latency

4. **Monitoring:**
   - Log all AI requests/responses
   - Track error rates
   - Monitor Groq API usage

5. **Fallback:**
   - Have backup AI provider (OpenAI, Anthropic)
   - Implement graceful degradation

---

## 💰 Cost Estimation

**Groq Pricing (as of Dec 2024):**
- Free tier: 14,400 requests/day
- Beyond free tier: Check Groq's pricing page

**Estimated Usage:**
- Average message: ~100 tokens
- AI response: ~500 tokens
- Total per exchange: ~600 tokens
- Free tier covers: ~10,000 exchanges/day

---

## 🎨 UI/UX Recommendations

### Visual Indicators:
- Show "AI is typing..." indicator
- Disable input while AI generates
- Show spinner/loading state
- Highlight AI messages (different color/icon)

### User Experience:
- Pre-populate suggested questions
- Show AI avatar (already configured)
- Add "Stop generating" button for long responses
- Show token usage/limits

### Accessibility:
- Screen reader announcements for AI responses
- Keyboard shortcuts for sending
- Focus management

---

## 📝 Summary

You now have a fully functional AI chat system powered by Groq's LLaMA 3.3 70B model!

**What's working:**
✅ User sends message → AI responds  
✅ Automatic chat creation with AI  
✅ Real-time Socket.IO updates  
✅ Error handling with retries  
✅ Message linking (reply context)  
✅ Fallback error messages  

**Next steps:**
1. Add GROQ_API_KEY to .env
2. Replace MessageController.js
3. Replace ChatRoutes.js
4. Test the endpoints
5. Build frontend UI
6. Deploy! 🚀
