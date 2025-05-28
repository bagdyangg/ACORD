# 🚀 Complete Deployment Guide

## 📦 What You Have

Your WhatsApp Lunch Ordering System is now ready for deployment! Here's what the package includes:

### ✅ Core Features
- **Image-only menu system** - Perfect for WhatsApp workflow
- **Bulk image upload** - Drag and drop multiple photos
- **Order processing** - Automatically adds quantity numbers to images
- **Restaurant export** - Save processed images to any folder
- **Admin panel** - Complete order management
- **User authentication** - Secure access control

## 🏗️ Deployment Options

### Option 1: Docker (Recommended)
**Fastest setup - everything included!**

```bash
# 1. Download all project files to your server
# 2. Create environment file
cp .env.example .env
# Edit .env with your settings

# 3. Start everything
docker-compose up -d

# 4. Your app is ready at http://your-server-ip
```

### Option 2: Traditional Server Setup
**For existing infrastructure:**

```bash
# 1. Install dependencies
npm install

# 2. Set up database
createdb lunch_orders
npm run db:push

# 3. Build and start
npm run build
npm start
```

### Option 3: Simple Local Setup
**For testing or small teams:**

```bash
# Quick start for development
npm install
npm run dev
# Visit http://localhost:5000
```

## ⚙️ Configuration

### Environment Variables (.env)
```env
# Required
DATABASE_URL=postgresql://user:pass@localhost:5432/lunch_orders
SESSION_SECRET=your-32-character-secret-key

# Optional (for authentication)
REPL_ID=your-app-id
REPLIT_DOMAINS=yourdomain.com

# Server
NODE_ENV=production
PORT=5000
```

### Admin Access
After first user logs in, set them as admin:
```sql
UPDATE users SET role = 'admin' WHERE email = 'your-email@domain.com';
```

## 🎯 How to Use

### For Employees:
1. **View Menu** - See today's dish photos
2. **Select Dishes** - Click images to add to order
3. **Confirm Order** - Submit selections

### For Administrators:
1. **Upload Menu** - Bulk upload today's dish photos
2. **View Orders** - See all employee orders
3. **Create Order** - Process images with quantity numbers
4. **Send to Restaurant** - Export processed images to folder

## 🔧 Production Setup

### Nginx Configuration
The included `nginx.conf` provides:
- Static file serving
- Rate limiting
- Security headers
- Image optimization

### Database Backup
```bash
# Daily backup script
pg_dump lunch_orders > backup_$(date +%Y%m%d).sql
```

### File Storage
- Images stored in `/uploads` folder
- Automatic cleanup can be added if needed
- Consider cloud storage for scale

## 🛠️ Customization Options

### Remove Authentication
For internal networks, you can disable login:
1. Comment out auth middleware in `server/routes.ts`
2. Set default admin user

### Change Styling
- Edit `client/src/index.css` for colors
- Modify `tailwind.config.ts` for themes
- Update logo in navigation component

### Add Features
- Email notifications
- Order scheduling
- Menu planning
- Analytics dashboard

## 📱 Mobile Experience
- Fully responsive design
- Touch-friendly interface
- Works great on tablets for restaurant use

## 🔒 Security Features
- Session-based authentication
- File upload validation
- SQL injection prevention
- Rate limiting included

## 📊 Monitoring
Add these for production:
- Error logging (Winston)
- Performance monitoring
- Disk space alerts for uploads folder

## 🆘 Support & Troubleshooting

### Common Issues:
1. **Images not loading** - Check nginx static file config
2. **Database errors** - Verify connection string
3. **Upload failures** - Check folder permissions

### Need Help?
The system is designed to be simple and reliable. Most issues are related to:
- Database connection
- File permissions
- Network configuration

Your lunch ordering system is production-ready! The image-only approach makes it perfect for your WhatsApp workflow - employees can quickly browse and select from photos just like they would in a chat.

🎉 **Ready to launch!** Start with Docker for the easiest setup, then customize as needed.