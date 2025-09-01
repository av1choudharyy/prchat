# Backend Development Dockerfile
FROM node:18-alpine

# Install nodemon globally for development
RUN npm install -g nodemon

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (including dev dependencies)
RUN npm install

# Copy application files
COPY . .

# Expose port
EXPOSE 5000

# Start the application with nodemon for hot reload
CMD ["nodemon", "server.js"]