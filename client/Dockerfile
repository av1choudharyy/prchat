# Frontend Development Dockerfile with Hot Reload
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application files
COPY . .

# Update proxy configuration for Docker
RUN sed -i 's/"proxy": "http:\/\/localhost:5000"/"proxy": "http:\/\/backend:5000"/' package.json

# Expose port
EXPOSE 3000

# Set environment variable to disable host check for tunneling
ENV DANGEROUSLY_DISABLE_HOST_CHECK=true

# Start the development server
CMD ["npm", "start"]