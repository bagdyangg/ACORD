# WhatsApp Lunch Ordering System

A simplified image-only lunch ordering system for office employees with WhatsApp integration.

## Features

- **Image-only menu system** - No text fields, just dish photos
- **Daily menu reset** - Only today's uploaded images available for ordering
- **Bulk image upload** - Admin can upload multiple images at once
- **Order processing** - Automatically adds order quantities to dish images
- **Restaurant integration** - Export processed images with order counts
- **User authentication** - Secure login with Replit OAuth
- **Admin panel** - Manage dishes, view orders, export reports

## System Requirements

- Node.js 18+ 
- PostgreSQL database
- Modern web browser with File System Access API support (Chrome/Edge recommended)

## Installation

1. **Clone and install dependencies:**
```bash
npm install
```

2. **Set up environment variables:**
Create a `.env` file with:
```env
DATABASE_URL=postgresql://username:password@localhost:5432/lunch_orders
SESSION_SECRET=your-super-secret-session-key-here
REPL_ID=your-replit-app-id
ISSUER_URL=https://replit.com/oidc
REPLIT_DOMAINS=your-domain.com
NODE_ENV=production
```

3. **Set up database:**
```bash
npm run db:push
```

4. **Create admin user:**
Update the users table to set admin role:
```sql
UPDATE users SET role = 'admin' WHERE email = 'your-admin-email@domain.com';
```

5. **Create uploads directory:**
```bash
mkdir uploads
chmod 755 uploads
```

6. **Build and start:**
```bash
npm run build
npm start
```

## Usage

### For Employees:
1. Visit the main dashboard
2. View today's menu (image-only)
3. Select desired dishes by clicking on images
4. Confirm order in the summary panel

### For Administrators:
1. Go to `/admin` or click Admin in navigation
2. **Upload Menu tab:** Bulk upload dish images for today
3. **Orders Summary tab:** View all orders and statistics
4. **Create Order:** Process images with order quantities overlay
5. **Send to Restaurant:** Export processed images to folder
6. **Export Report:** Download CSV with order details

## File Structure

```
├── client/               # Frontend React application
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Main application pages
│   │   └── hooks/        # Custom React hooks
├── server/               # Backend Express application
│   ├── db.ts            # Database connection
│   ├── routes.ts        # API routes
│   ├── storage.ts       # Database operations
│   └── replitAuth.ts    # Authentication setup
├── shared/              # Shared TypeScript schemas
├── uploads/             # User uploaded images
└── package.json         # Dependencies and scripts
```

## API Endpoints

- `GET /api/dishes` - Get today's dishes
- `POST /api/dishes` - Upload new dish (admin only)
- `GET /api/orders` - Get user's orders
- `POST /api/orders` - Create new order
- `GET /api/admin/orders` - Get orders summary (admin only)
- `GET /api/admin/users` - Get all users (admin only)

## Deployment Notes

- Ensure PostgreSQL is running and accessible
- Set up proper SSL certificates for production
- Configure reverse proxy (nginx recommended)
- Set up automated backups for database and uploads folder
- Monitor disk space for uploads directory

## Security

- All routes protected with session authentication
- Admin routes require admin role in database
- File uploads validated and stored securely
- CSRF protection enabled
- SQL injection prevention with parameterized queries

## Support

For technical support or feature requests, contact the development team.