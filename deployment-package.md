# Deployment Package Instructions

## Quick Setup Guide

### 1. Download Complete Project
Download all project files to your server. The main components you need:

**Core Files:**
- `package.json` - Dependencies
- `tsconfig.json` - TypeScript configuration  
- `vite.config.ts` - Build configuration
- `tailwind.config.ts` - Styling configuration
- `drizzle.config.ts` - Database configuration

**Application Code:**
- `server/` folder - Backend API
- `client/` folder - Frontend application
- `shared/` folder - Shared schemas

### 2. Environment Setup
Create `.env` file in root directory:

```env
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/lunch_orders

# Session Security
SESSION_SECRET=your-very-long-random-secret-key-minimum-32-characters

# Authentication (if using Replit Auth)
REPL_ID=your-app-id
ISSUER_URL=https://replit.com/oidc
REPLIT_DOMAINS=yourdomain.com

# Environment
NODE_ENV=production
PORT=5000
```

### 3. Database Setup
```bash
# Install PostgreSQL and create database
createdb lunch_orders

# Install dependencies
npm install

# Push database schema
npm run db:push

# Set admin user (replace with your email)
psql lunch_orders -c "UPDATE users SET role = 'admin' WHERE email = 'your-email@domain.com';"
```

### 4. File Permissions
```bash
# Create uploads directory
mkdir uploads
chmod 755 uploads
chown www-data:www-data uploads  # if using nginx
```

### 5. Build and Deploy
```bash
# Build production version
npm run build

# Start application
npm run start
```

## Production Server Configuration

### Nginx Configuration
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    
    # Serve static files
    location /uploads/ {
        alias /path/to/your/app/uploads/;
        expires 1d;
        add_header Cache-Control "public, immutable";
    }
    
    # Proxy to Node.js
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### PM2 Process Manager
```bash
# Install PM2
npm install -g pm2

# Create ecosystem file
echo 'module.exports = {
  apps: [{
    name: "lunch-orders",
    script: "./server/index.ts",
    interpreter: "npx",
    interpreter_args: "tsx",
    env: {
      NODE_ENV: "production"
    }
  }]
}' > ecosystem.config.js

# Start with PM2
pm2 start ecosystem.config.js
pm2 startup
pm2 save
```

### SystemD Service (Alternative)
```bash
# Create service file
sudo tee /etc/systemd/system/lunch-orders.service > /dev/null <<EOF
[Unit]
Description=Lunch Orders System
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/your/app
ExecStart=/usr/bin/npm start
Restart=on-failure
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

# Enable and start service
sudo systemctl enable lunch-orders
sudo systemctl start lunch-orders
```

## Authentication Configuration

### Option 1: Disable Auth (Simple Setup)
If you want to skip authentication for internal use:

1. Comment out auth middleware in `server/routes.ts`:
```typescript
// app.use(passport.initialize());
// app.use(passport.session());
```

2. Remove `isAuthenticated` from protected routes
3. Set default admin user in storage

### Option 2: Keep Replit Auth
Contact me if you need help setting up OAuth with your domain.

### Option 3: Custom Auth
We can implement simple email/password authentication if needed.

## Database Backup
```bash
# Create backup script
echo '#!/bin/bash
pg_dump lunch_orders > /backups/lunch_orders_$(date +%Y%m%d_%H%M%S).sql
find /backups -name "lunch_orders_*.sql" -mtime +7 -delete
' > backup.sh

chmod +x backup.sh

# Add to crontab for daily backups
echo "0 2 * * * /path/to/backup.sh" | crontab -
```

## Troubleshooting

**Images not loading:**
- Check uploads folder permissions
- Verify nginx static file serving
- Check file paths in database

**Database connection issues:**
- Verify DATABASE_URL format
- Check PostgreSQL is running
- Test connection: `psql $DATABASE_URL`

**Build failures:**
- Clear node_modules: `rm -rf node_modules && npm install`
- Check Node.js version: `node --version` (needs 18+)

Ready to deploy! Let me know if you need help with any specific part of the setup.