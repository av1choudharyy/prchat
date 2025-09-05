# PRChat Deployment Guide

This guide covers how to deploy PRChat to various platforms for production use.

## 🌐 Production Environment Variables

Create a production `.env` file with these settings:

```env
PORT=5000
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/prchat
JWT_SECRET=your_super_secure_production_jwt_secret_key_here
JWT_EXPIRE=7d
NODE_ENV=production
```

⚠️ **Security Notes:**
- Use a strong, unique JWT_SECRET (32+ characters)
- Use MongoDB Atlas or secure MongoDB instance
- Never commit `.env` files to version control

## 🐳 Docker Production Deployment

### 1. Docker Hub Deployment

1. **Build Production Images**:
```bash
# Build backend image
docker build -t prchat-backend .

# Build frontend image  
docker build -t prchat-frontend ./client

# Tag for Docker Hub
docker tag prchat-backend yourusername/prchat-backend
docker tag prchat-frontend yourusername/prchat-frontend

# Push to Docker Hub
docker push yourusername/prchat-backend
docker push yourusername/prchat-frontend
```

2. **Production Docker Compose**:
Create `docker-compose.prod.yml`:
```yaml
version: '3.8'

services:
  backend:
    image: yourusername/prchat-backend
    ports:
      - "5000:5000"
    environment:
      - PORT=5000
      - MONGO_URI=${MONGO_URI}
      - JWT_SECRET=${JWT_SECRET}
      - JWT_EXPIRE=7d
      - NODE_ENV=production
    restart: unless-stopped

  frontend:
    image: yourusername/prchat-frontend
    ports:
      - "80:80"
    depends_on:
      - backend
    restart: unless-stopped
```

3. **Deploy**:
```bash
docker-compose -f docker-compose.prod.yml up -d
```

## ☁️ Cloud Platform Deployments

### Heroku Deployment

1. **Prepare for Heroku**:
```bash
# Install Heroku CLI
npm install -g heroku

# Login to Heroku
heroku login

# Create app
heroku create your-prchat-app
```

2. **Configure Environment**:
```bash
# Set environment variables
heroku config:set MONGO_URI="your_mongodb_atlas_uri"
heroku config:set JWT_SECRET="your_production_jwt_secret"
heroku config:set JWT_EXPIRE="7d"
heroku config:set NODE_ENV="production"
```

3. **Create Heroku Dockerfile**:
```dockerfile
# Heroku Dockerfile
FROM node:16

WORKDIR /app

# Copy backend files
COPY package*.json ./
RUN npm install

# Copy frontend and build
COPY client/package*.json ./client/
RUN cd client && npm install

COPY . .
RUN cd client && npm run build

EXPOSE $PORT

CMD ["npm", "start"]
```

4. **Deploy**:
```bash
# Deploy to Heroku
git add .
git commit -m "Deploy to Heroku"
git push heroku main
```

### Railway Deployment

1. **Connect Repository**:
   - Visit railway.app
   - Connect your GitHub repository
   - Select the PRChat repository

2. **Configure Environment**:
   - Add environment variables in Railway dashboard
   - Set start command: `npm start`

3. **Deploy**:
   - Railway will automatically deploy on git push

### DigitalOcean App Platform

1. **Create App**:
   - Go to DigitalOcean App Platform
   - Connect GitHub repository
   - Configure build and run commands

2. **Environment Configuration**:
```yaml
# .do/app.yaml
name: prchat
services:
- name: backend
  source_dir: /
  github:
    repo: your-username/prchat
    branch: main
  run_command: npm start
  environment_slug: node-js
  instance_count: 1
  instance_size_slug: basic-xxs
  envs:
  - key: MONGO_URI
    value: your_mongodb_uri
  - key: JWT_SECRET
    value: your_jwt_secret
  - key: NODE_ENV
    value: production
```

## 🔧 Performance Optimizations

### 1. Frontend Optimizations

**Build Optimization** (`client/package.json`):
```json
{
  "scripts": {
    "build": "GENERATE_SOURCEMAP=false react-scripts build"
  }
}
```

**Environment Configuration** (`client/.env.production`):
```env
REACT_APP_API_URL=https://your-backend-url.com
GENERATE_SOURCEMAP=false
```

### 2. Backend Optimizations

**Production Dependencies**:
```bash
# Install only production dependencies
npm ci --only=production
```

**Server Optimizations** (add to `server.js`):
```javascript
// Enable compression
const compression = require('compression');
app.use(compression());

// Security headers
const helmet = require('helmet');
app.use(helmet());

// Rate limiting
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);
```

### 3. Database Optimizations

**MongoDB Indexes**:
```javascript
// Add to your MongoDB setup
db.messages.createIndex({ chat: 1, createdAt: -1 })
db.chats.createIndex({ users: 1 })
db.users.createIndex({ email: 1 })
```

## 🌍 CDN and Static Asset Optimization

### Cloudflare Setup

1. **Add Domain to Cloudflare**
2. **Configure DNS**:
   - A record: `@` → Your server IP
   - CNAME: `www` → your-domain.com

3. **Performance Settings**:
   - Enable auto-minification (CSS, JS, HTML)
   - Enable Brotli compression
   - Set cache level to "Standard"

### AWS CloudFront

1. **Create Distribution**:
   - Origin: Your deployed application URL
   - Viewer Protocol Policy: Redirect HTTP to HTTPS
   - Compress Objects Automatically: Yes

2. **Cache Behaviors**:
   - Static assets: Cache for 1 year
   - API routes: No cache
   - HTML files: Cache for 1 hour

## 📊 Monitoring and Analytics

### 1. Application Monitoring

**Add PM2 for Process Management**:
```bash
npm install -g pm2

# Create ecosystem.config.js
module.exports = {
  apps: [{
    name: 'prchat',
    script: './server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    }
  }]
}

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 2. Error Tracking

**Sentry Integration**:
```bash
npm install @sentry/node

# Add to server.js
const Sentry = require("@sentry/node");
Sentry.init({ dsn: "YOUR_SENTRY_DSN" });
```

### 3. Analytics

**Google Analytics** (add to `client/public/index.html`):
```html
<!-- Global site tag (gtag.js) - Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_TRACKING_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_TRACKING_ID');
</script>
```

## 🔒 Security Considerations

### 1. HTTPS Configuration

**Let's Encrypt with Nginx**:
```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name your-domain.com;
    
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    
    location /api {
        proxy_pass http://localhost:5000;
    }
    
    location /socket.io {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

### 2. Environment Security

- Use environment variables for all secrets
- Enable firewall (UFW on Ubuntu)
- Regular security updates
- MongoDB access restrictions
- Rate limiting on API endpoints

## 🚀 Launch Checklist

- [ ] Environment variables configured
- [ ] Database indexes created
- [ ] SSL certificate installed
- [ ] Domain DNS configured
- [ ] Monitoring tools setup
- [ ] Error tracking enabled
- [ ] Performance monitoring active
- [ ] Backup strategy implemented
- [ ] Security headers configured
- [ ] Rate limiting enabled
- [ ] CDN configured (optional)
- [ ] Analytics tracking setup

## 📈 Scaling Considerations

### Horizontal Scaling

1. **Load Balancer Configuration**
2. **Multiple Server Instances**
3. **Redis for Session Management**
4. **Database Clustering**

### Vertical Scaling

1. **Increase server resources**
2. **Optimize database queries**
3. **Implement caching strategies**
4. **Monitor performance metrics**

Your PRChat application is now ready for production deployment! 🎉
