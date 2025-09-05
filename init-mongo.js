// MongoDB initialization script
// This script runs when the MongoDB container is first created

db = db.getSiblingDB('prchat');

// Create a dedicated user for the prchat database
db.createUser({
  user: 'prchat_user',
  pwd: 'prchat_pass',
  roles: [
    {
      role: 'readWrite',
      db: 'prchat'
    }
  ]
});

// Create collections with validation
db.createCollection('users');
db.createCollection('chats');
db.createCollection('messages');

// Seed test users for evaluation
// Password "password123" hashed with bcrypt (10 rounds)
const hashedPassword = '$2a$10$vmh01Fb/.hPL9qYnkWCsxOORKfiD9sJ5D8f6GKt1Q3dcli2smsd9y';
// Password "123456" hashed with bcrypt (10 rounds) 
const guestPassword = '$2a$10$WMf7C0/Eyz4Sxg6kOzZlOOL/QYqJ8h6ytvJ4cGTYHzV9Z1rkgSX1.';

db.users.insertMany([
  {
    name: 'Test User 1',
    email: 'test1@example.com',
    password: hashedPassword,
    pic: 'https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg',
    isAdmin: false,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Test User 2',
    email: 'test2@example.com',
    password: hashedPassword,
    pic: 'https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg',
    isAdmin: false,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Test User 3',
    email: 'test3@example.com',
    password: hashedPassword,
    pic: 'https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg',
    isAdmin: false,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Guest User',
    email: 'guest@example.com',
    password: guestPassword,
    pic: 'https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg',
    isAdmin: false,
    createdAt: new Date(),
    updatedAt: new Date()
  }
]);

print('PRChat database initialized with test users!');
print('Test users created:');
print('- test1@example.com / password123');
print('- test2@example.com / password123');
print('- test3@example.com / password123');
print('- guest@example.com / 123456');