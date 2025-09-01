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
const hashedPassword = '$2a$10$Q3WYZ.VcOcwLvKlqRkKNyOD4dDmhRs7RhvRKlqxT5FBp8lGDFKOGO';

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
    password: '$2a$10$NQE3r4Klmr9zuV5yN2OTQO8Im1lOVaH0MBNVJQzBKylfgQ.PhbhVy', // password: 123456
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