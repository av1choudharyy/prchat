# PRChat Testing Guide

This guide will help you test all the implemented features of the PRChat application.

## Prerequisites

1. **Application Running**: Make sure the application is running using either:
   - Docker: `docker-compose up --build`
   - Local: `npm run server` (Terminal 1) and `npm run client` (Terminal 2)

2. **Access URLs**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## Test Scenarios

### 🔐 Authentication Testing

#### Test User Registration
1. Navigate to http://localhost:3000
2. Click "Sign Up" tab
3. Fill in new user details:
   - Name: Your Test Name
   - Email: yourtest@example.com
   - Password: testpassword
4. Click "Sign Up"
5. ✅ Should redirect to chat page and show user in top-right

#### Test User Login
1. Use pre-configured test accounts:
   - Email: `test1@example.com`, Password: `password123`
   - Email: `test2@example.com`, Password: `password123`
   - Email: `guest@example.com`, Password: `123456`
2. Click "Login" tab
3. Enter credentials and click "Login"
4. ✅ Should redirect to chat page with user authenticated

### 💬 Real-time Messaging Testing

#### Test Direct Messages
1. **Setup**: Open two browser windows/tabs
   - Window 1: Login as `test1@example.com`
   - Window 2: Login as `test2@example.com`

2. **Create Chat** (Window 1):
   - Click "Search User" button
   - Search for "Test User 2"
   - Click on the user to start chat

3. **Send Messages**:
   - Type a message in Window 1 and press Enter
   - ✅ Message should appear immediately in Window 2
   - Reply from Window 2
   - ✅ Should appear immediately in Window 1

4. **Test Typing Indicators**:
   - Start typing in Window 1 (don't send)
   - ✅ Window 2 should show typing animation
   - Stop typing for 3 seconds
   - ✅ Typing indicator should disappear

### 👥 Group Chat Testing

#### Create Group Chat
1. **Login**: Use `test1@example.com`
2. **Create Group**:
   - Click "New Group Chat" button
   - Enter group name: "Test Group"
   - Search and add multiple users:
     - Add "Test User 2"
     - Add "Test User 3"
   - Click "Create Chat"
   - ✅ Group should appear in chat list

#### Test Group Messaging
1. **Setup**: Open three browser windows
   - Window 1: `test1@example.com` (Group Admin)
   - Window 2: `test2@example.com` (Member)
   - Window 3: `test3@example.com` (Member)

2. **Group Communication**:
   - Send message from Window 1
   - ✅ Should appear in Windows 2 & 3
   - Reply from different windows
   - ✅ All participants should see all messages

#### Test Group Management
1. **As Group Admin** (test1@example.com):
   - Click on group name to open settings
   - Try renaming the group
   - ✅ Should update for all members
   - Add a new user to the group
   - ✅ New user should see the group
   - Remove a user from the group
   - ✅ Removed user should lose access

### 🔔 Notification Testing

#### Test Message Notifications
1. **Setup**: Two browser windows as before
2. **Background Chat**:
   - Window 1: In chat with User 2
   - Window 2: Switch to a different chat or stay on chat list
3. **Send Message**:
   - Send message from Window 1
   - ✅ Window 2 should show red notification badge
   - ✅ Notification count should be accurate
4. **Click Notification**:
   - Click the bell icon in Window 2
   - ✅ Should show notification with sender info
   - Click on notification
   - ✅ Should open the correct chat

### 📱 Responsive Design Testing

1. **Mobile View**:
   - Resize browser window to mobile size (< 768px)
   - ✅ Chat list should hide when a chat is selected
   - ✅ Back arrow should appear in chat header
   - ✅ Components should stack properly

2. **Tablet View**:
   - Resize to tablet size (768px - 1024px)
   - ✅ Should show side-by-side layout
   - ✅ All features should remain functional

### 🔧 Error Handling Testing

#### Test Network Disconnection
1. Open browser developer tools (F12)
2. Go to Network tab and set throttling to "Offline"
3. Try sending a message
4. ✅ Should show appropriate error message
5. Restore network connection
6. ✅ Should reconnect automatically

#### Test Invalid Data
1. Try logging in with wrong credentials
2. ✅ Should show "Invalid Email or Password" error
3. Try creating group with just 1 user
4. ✅ Should show "More than 2 users required" error

## 🐛 Common Issues & Solutions

### Socket.io Connection Issues
- **Problem**: Messages not appearing in real-time
- **Solution**: Check browser console for connection errors
- **Fix**: Ensure backend is running on port 5000

### Authentication Problems
- **Problem**: Login redirects to home page
- **Solution**: Check JWT token in localStorage
- **Fix**: Clear localStorage and login again

### Database Connection Issues
- **Problem**: Cannot create users or chats
- **Solution**: Check MongoDB connection
- **Fix**: Ensure MongoDB is running (Docker or local)

## ✅ Feature Completion Checklist

- [x] User Registration & Authentication
- [x] Real-time Messaging (Socket.io)
- [x] Direct Messages (One-on-One)
- [x] Group Chat Creation & Management
- [x] Typing Indicators
- [x] Message Notifications
- [x] Responsive Design
- [x] Error Handling
- [x] User Search Functionality
- [x] Chat History Persistence
- [x] Real-time User Status
- [x] Message Timestamps
- [x] Group Admin Controls
- [x] **Message Search (NEW)**
- [x] **Copy Message Function (NEW)**
- [x] **Reply-to-Message Feature (NEW)**

## 🆕 **Testing Enhanced Features**

### **Message Search Testing**

1. **Basic Search Functionality**:
   - Open a chat with multiple messages
   - Click the search icon (🔍) in the chat header
   - ✅ Search bar should appear below header
   - Type a word that exists in messages
   - ✅ Messages should filter in real-time
   - ✅ Results counter should show "X results found"

2. **Search Navigation**:
   - Perform a search that returns multiple results
   - ✅ Should show "X of Y" badge with navigation arrows
   - Click ↑ and ↓ arrows to navigate results
   - ✅ Current result should be highlighted with blue border
   - ✅ Page should scroll to highlighted message

3. **Clear Search**:
   - Click the ❌ icon in search bar
   - ✅ Should return to normal message view
   - ✅ All messages should be visible again

### **Copy Message Testing**

1. **Copy Function Access**:
   - Hover over any message bubble
   - ✅ Action buttons should appear (copy and reply icons)
   - Click the copy icon (📄)
   - ✅ Success notification should appear

2. **Clipboard Verification**:
   - After copying a message, paste in another application
   - ✅ Should paste the exact message text
   - ✅ Should work on different message types

3. **Error Handling**:
   - Test in HTTP environment (clipboard might fail)
   - ✅ Should show appropriate error message if copy fails

### **Reply-to-Message Testing**

1. **Start Reply**:
   - Hover over a message you want to reply to
   - Click the reply icon (💬)
   - ✅ Reply preview should appear above message input
   - ✅ Preview should show sender name and original message

2. **Send Reply**:
   - Type a reply message
   - Press Enter to send
   - ✅ Reply should appear with quoted original message
   - ✅ Original message should be visually distinct in reply

3. **Cancel Reply**:
   - Start a reply but click ❌ in reply preview
   - ✅ Should return to normal input mode
   - ✅ Reply preview should disappear

4. **Real-time Reply Reception**:
   - Have another user reply to your message
   - ✅ Reply should appear immediately with quote
   - ✅ Should work in both direct and group chats

## 📈 Performance Testing

1. **Message Load Testing**:
   - Send 50+ messages in a chat
   - ✅ Should scroll smoothly
   - ✅ All messages should load

2. **Multiple Chat Testing**:
   - Create 5+ different chats
   - ✅ Switching should be instant
   - ✅ Each chat should maintain its state

3. **Concurrent User Testing**:
   - Have 4+ users in same group chat
   - ✅ All should receive messages simultaneously
   - ✅ No message duplication or loss

## 🎯 Success Criteria

All features should work smoothly with:
- ⚡ Real-time message delivery (< 100ms)
- 🔔 Instant notifications
- 💻 Cross-browser compatibility
- 📱 Mobile responsiveness
- 🔐 Secure authentication
- 👥 Scalable group chats
- ⌨️ Smooth typing indicators

If all tests pass, the PRChat application is fully functional and ready for production deployment!
