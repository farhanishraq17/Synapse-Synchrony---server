# 📚 PIECE 1: Data Models - Complete Documentation

***

## 🎯 Overview

**Piece 1** implemented the foundational database schemas for a real-time chat system using MongoDB and Mongoose. This piece establishes the data structure for conversations, messages, and read receipts with future-ready fields for attachments.

***

## 📦 What Was Built

### **Three Mongoose Models:**

1. **Conversation.js** - Manages 1:1 and group chat conversations
2. **Message.js** - Stores chat messages with support for future attachments
3. **ReadReceipt.js** - Tracks read status and unread counts per user

***

## 📂 File Structure Created

```
Synapse-Synchrony---server/
├── models/
│   ├── User.js                    # Existing - Authentication
│   ├── Conversation.js            # NEW - Chat conversations
│   ├── Message.js                 # NEW - Chat messages
│   └── ReadReceipt.js             # NEW - Read tracking
│
└── tests/
    └── unit/
        └── models/
            └── chatModels.test.js # NEW - Model tests
```

***

## 🗂️ File 1: Conversation.js

**Path:** `Synapse-Synchrony---server/models/Conversation.js`

### **Purpose:**
Manages both direct (1:1) and group conversations with embedded participant tracking.

### **Schema Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | String (enum) | Yes | `'direct'` or `'group'` |
| `name` | String | Conditional | Required for groups, optional for direct |
| `participants` | Array | Yes | Embedded array of participant objects |
| `participants.userId` | ObjectId | Yes | Reference to User model |
| `participants.role` | String (enum) | Yes | `'member'` or `'admin'` |
| `participants.joinedAt` | Date | Yes | When user joined conversation |
| `createdBy` | ObjectId | Yes | User who created the conversation |
| `lastMessage` | Object | No | Preview of most recent message |
| `lastMessage.content` | String | No | Truncated message content (max 200 chars) |
| `lastMessage.senderId` | ObjectId | No | Who sent the last message |
| `lastMessage.timestamp` | Date | No | When last message was sent |
| `avatar` | String | No | URL to group avatar (future-ready) |
| `createdAt` | Date | Auto | Mongoose timestamp |
| `updatedAt` | Date | Auto | Mongoose timestamp |

### **Indexes Created:**

```javascript
1. { 'participants.userId': 1 }              // Find conversations by participant
2. { updatedAt: -1 }                         // Sort by most recent activity
3. { type: 1, 'participants.userId': 1 }     // Filter by type + participant
4. { createdBy: 1 }                          // Find conversations by creator
```

### **Instance Methods:**

```javascript
// Check if user is a participant
conversation.isParticipant(userId) → boolean

// Check if user is an admin
conversation.isAdmin(userId) → boolean

// Get total participant count
conversation.getParticipantCount() → number
```

### **Static Methods:**

```javascript
// Find all conversations for a user
Conversation.findByUserId(userId) → Promise<Array>

// Get or create a direct conversation between two users
Conversation.getOrCreateDirect(userId1, userId2) → Promise<Conversation>
```

### **Validation Rules:**

- `type`: Must be 'direct' or 'group'
- `name`: Required if type is 'group', max 100 characters
- `participants`: Array cannot be empty
- `createdBy`: Must be valid ObjectId

### **Use Cases:**

✅ Create 1:1 direct chat between two users  
✅ Create group chat with multiple participants  
✅ Prevent duplicate direct conversations  
✅ Track conversation activity for sorting  
✅ Show last message preview in conversation list  

***

## 🗂️ File 2: Message.js

**Path:** `Synapse-Synchrony---server/models/Message.js`

### **Purpose:**
Stores individual messages within conversations with support for text, images, and files (future-ready).

### **Schema Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `conversationId` | ObjectId | Yes | Reference to Conversation |
| `senderId` | ObjectId | Yes | User who sent the message |
| `content` | String | Conditional | Required for text or when no attachments, max 5000 chars |
| `type` | String (enum) | Yes | `'text'`, `'image'`, or `'file'` (default: 'text') |
| `attachments` | Array | No | Array of attachment objects (future-ready) |
| `attachments.url` | String | Yes | URL to attachment |
| `attachments.mime` | String | No | MIME type (e.g., 'image/jpeg') |
| `attachments.size` | Number | No | File size in bytes |
| `attachments.width` | Number | No | Image width (for images only) |
| `attachments.height` | Number | No | Image height (for images only) |
| `attachments.name` | String | No | Original filename |
| `isEdited` | Boolean | No | Whether message was edited |
| `isDeleted` | Boolean | No | Soft delete flag |
| `editHistory` | Array | No | Array of previous content versions |
| `reactions` | Map | No | Map of emoji → array of user IDs |
| `createdAt` | Date | Auto | Mongoose timestamp |
| `updatedAt` | Date | Auto | Mongoose timestamp |

### **Indexes Created:**

```javascript
1. { conversationId: 1 }                              // Basic lookup
2. { senderId: 1 }                                    // Messages by sender
3. { conversationId: 1, createdAt: -1 }               // Pagination (primary)
4. { conversationId: 1, createdAt: -1, _id: -1 }      // Cursor pagination with tie-breaker
5. { senderId: 1, createdAt: -1 }                     // User's message history
6. { conversationId: 1, isDeleted: 1 }                // Filter deleted messages
```

### **Instance Methods:**

```javascript
// Soft delete a message
message.softDelete() → Promise<Message>

// Edit message content (saves original to history)
message.editContent(newContent) → Promise<Message>

// Add emoji reaction
message.addReaction(emoji, userId) → Promise<Message>

// Remove emoji reaction
message.removeReaction(emoji, userId) → Promise<Message>
```

### **Static Methods:**

```javascript
// Get messages for conversation with pagination
Message.getConversationMessages(conversationId, limit, before) → Promise<Array>

// Count unread messages since lastReadAt
Message.countUnread(conversationId, lastReadAt) → Promise<number>
```

### **Validation Rules:**

- `type`: Must be 'text', 'image', or 'file'
- `content`: Required if type='text' or no attachments, max 5000 characters
- `conversationId`: Must be valid ObjectId
- `senderId`: Must be valid ObjectId

### **Use Cases:**

✅ Send text messages  
✅ Track message edit history  
✅ Soft delete messages  
✅ Add/remove emoji reactions  
✅ Cursor-based pagination for loading message history  
✅ Count unread messages  
✅ Future: Support image and file attachments  

***

## 🗂️ File 3: ReadReceipt.js

**Path:** `Synapse-Synchrony---server/models/ReadReceipt.js`

### **Purpose:**
Tracks the last message each user has read in each conversation, enabling unread count badges and "seen by" features.

### **Schema Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `conversationId` | ObjectId | Yes | Reference to Conversation |
| `userId` | ObjectId | Yes | User who read messages |
| `lastReadMessageId` | ObjectId | No | Last message user has read |
| `lastReadAt` | Date | Yes | Timestamp of last read action |
| `unreadCount` | Number | No | Cached unread count (default: 0) |
| `createdAt` | Date | Auto | Mongoose timestamp |
| `updatedAt` | Date | Auto | Mongoose timestamp |

### **Indexes Created:**

```javascript
1. { conversationId: 1, userId: 1 }        // Compound unique index (prevents duplicates)
2. { userId: 1, lastReadAt: -1 }           // User's read receipts sorted by recency
3. { conversationId: 1, lastReadAt: -1 }   // Conversation receipts sorted by recency
4. { userId: 1, unreadCount: 1 }           // Query unread counts efficiently
```

### **Instance Methods:**

```javascript
// Update read receipt
readReceipt.markRead(messageId) → Promise<ReadReceipt>
```

### **Static Methods:**

```javascript
// Mark messages as read (upsert: create or update)
ReadReceipt.markAsRead(userId, conversationId, messageId) → Promise<ReadReceipt>

// Get read receipt for user in conversation
ReadReceipt.getReceipt(userId, conversationId) → Promise<ReadReceipt|null>

// Get all receipts for a conversation (who has read)
ReadReceipt.getConversationReceipts(conversationId) → Promise<Array>

// Update unread count cache
ReadReceipt.updateUnreadCount(userId, conversationId, count) → Promise<ReadReceipt>

// Increment unread for all participants except sender
ReadReceipt.incrementUnread(conversationId, excludeUserId) → Promise<void>
```

### **Validation Rules:**

- `conversationId`: Must be valid ObjectId
- `userId`: Must be valid ObjectId
- `lastReadAt`: Required, defaults to current date
- `unreadCount`: Must be >= 0
- **Unique constraint**: Only one receipt per (conversationId, userId) pair

### **Use Cases:**

✅ Track last read message per user  
✅ Calculate unread message counts  
✅ Show "seen by" indicators in group chats  
✅ Prevent duplicate receipts (compound unique index)  
✅ Efficiently query unread conversations  

***

## 🧪 Testing Implementation

**File:** `tests/unit/models/chatModels.test.js`

### **Test Coverage:**

| Test # | Test Name | Purpose | Result |
|--------|-----------|---------|--------|
| 1 | Verify indexes | Confirms all indexes are defined in schemas | ✅ 4+6+4 indexes |
| 2 | Required field validation | Tests missing required fields throw errors | ✅ Validation works |
| 3 | Enum validation | Tests invalid enum values are rejected | ✅ Rejects invalid |
| 4 | Embedded participants | Tests complex nested structure acceptance | ✅ Structure valid |
| 5 | Instance methods | Tests isParticipant, isAdmin, getParticipantCount | ✅ All methods work |
| 6 | Static methods | Tests markAsRead upsert and duplicate prevention | ✅ Upsert works |

### **Running Tests:**

```bash
# Run all model tests
npm test

# Expected output
=== TESTING CHAT MODELS ===
✅ Database connected
📋 Test 1: Verifying indexes... ✅
📋 Test 2: Testing required field validation... ✅
📋 Test 3: Testing enum validation... ✅
📋 Test 4: Testing embedded participants... ✅
📋 Test 5: Testing instance methods... ✅
📋 Test 6: Testing ReadReceipt static method... ✅
=== ALL TESTS COMPLETED ===
```

***

## 🔍 How to Verify in MongoDB

### **Option 1: MongoDB Shell (mongosh)**

```bash
mongosh

use synapse-synchrony
show collections

# Check indexes
db.conversations.getIndexes()
db.messages.getIndexes()
db.readreceipts.getIndexes()

# View documents (after creating data)
db.conversations.find().pretty()
db.messages.find().pretty()
db.readreceipts.find().pretty()

exit
```

### **Option 2: MongoDB Compass (GUI)**

1. Install: `brew install --cask mongodb-compass`
2. Open: `open -a "MongoDB Compass"`
3. Connect: `mongodb://localhost:27017`
4. Browse: `synapse-synchrony` database
5. Click **"Indexes"** tab to see all indexes

***

## 🎨 Design Decisions & Future-Ready Features

### **1. Embedded vs Referenced Participants**

**Decision:** Embedded participants array in Conversation  
**Rationale:**
- Participants rarely change (low write frequency)
- Always need participant list when fetching conversation
- Reduces database queries (no JOIN needed)
- Supports role-based permissions (member/admin)

### **2. Soft Delete Messages**

**Decision:** `isDeleted` flag instead of hard delete  
**Rationale:**
- Preserves message history for auditing
- Allows "undo delete" feature
- Maintains conversation continuity
- Can be permanently deleted later with cleanup job

### **3. Cursor Pagination with Tie-Breaker**

**Decision:** Compound index `(conversationId, createdAt, _id)`  
**Rationale:**
- Handles messages with identical timestamps
- Stable sort order (no duplicate/missing results)
- Efficient for infinite scroll
- Better than offset pagination for real-time data

### **4. Read Receipt Upsert Pattern**

**Decision:** `findOneAndUpdate` with `upsert: true`  
**Rationale:**
- Atomic operation (no race conditions)
- Creates or updates in single query
- Compound unique index prevents duplicates
- Efficient for high-frequency updates

### **5. Future-Ready Attachment Fields**

**Decision:** `type` enum and `attachments[]` array now  
**Implementation:** Later (Piece 8-9)  
**Rationale:**
- Schema designed now, prevents migration later
- Default values don't impact current functionality
- Easy to extend when upload service is built

***

## 📊 Performance Considerations

### **Index Strategy:**

| Collection | Index | Purpose | Cardinality |
|------------|-------|---------|-------------|
| conversations | participants.userId | High-frequency user queries | High |
| conversations | updatedAt DESC | Sort conversation list | High |
| messages | conversationId + createdAt DESC | Primary pagination query | Very High |
| messages | conversationId + createdAt + _id | Cursor pagination tie-breaker | Very High |
| readreceipts | conversationId + userId (unique) | Prevent duplicates, fast lookup | Medium |

### **Query Patterns:**

✅ **Efficient:**
```javascript
// Uses index: participants.userId_1
Conversation.find({ 'participants.userId': userId })

// Uses index: conversationId_1_createdAt_-1
Message.find({ conversationId, createdAt: { $lt: cursor } })
  .sort({ createdAt: -1 }).limit(50)
```

❌ **Avoid:**
```javascript
// No index - full collection scan
Conversation.find({ 'lastMessage.content': /keyword/ })
```

***

## 🔗 Integration with Existing System

### **Reuses Existing:**

✅ `User.js` model (via ObjectId references)  
✅ JWT authentication middleware (will use in routes)  
✅ RBAC roles (admin/moderator can moderate chats)  
✅ Rate limiting (will apply to chat endpoints)  
✅ Error handling format `{ success, message, errors }`  

### **New Dependencies Added:**

```json
{
  "socket.io": "^4.8.1"  // For real-time features (Piece 5+)
}
```

***

## ✅ Validation Checklist

Before moving to Piece 2, verify:

- [x] All 3 model files created in `models/`
- [x] Test file created in `tests/unit/models/`
- [x] Socket.IO installed (`npm list socket.io`)
- [x] MongoDB running (`brew services list | grep mongodb`)
- [x] `.env` has `MONGODB_URI=mongodb://localhost:27017/synapse-synchrony`
- [x] All tests pass (`npm test`)
- [x] Indexes visible in MongoDB Compass or mongosh
- [x] No console errors or warnings

***

## 🚀 What's Next: PIECE 2

**Conversation REST API** will provide:

- `POST /api/conversations/direct` - Create 1:1 chat
- `POST /api/conversations/group` - Create group chat
- `GET /api/conversations` - List user's conversations
- `GET /api/conversations/:id` - Get conversation details
- `POST /api/conversations/:id/members` - Add member to group
- `DELETE /api/conversations/:id/members/:userId` - Remove member

**Files to create:**
- `routes/conversation.js`
- `controllers/conversationController.js`
- `services/conversationService.js`

Type **"next"** when ready! 🎯