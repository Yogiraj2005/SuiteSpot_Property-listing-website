# 🏨 SuiteSpot 2.0

A full-stack accommodation booking platform built with Node.js, Express, and MongoDB. Features role-based access control for Admin, Property Owners, and Customers.

## 🌟 Features

### For Customers 👤
- Browse and search property listings
- View detailed property information with interactive maps
- Make bookings with date selection
- Write and read reviews
- Manage personal bookings
- View billing history

### For Property Owners 🏠
- Create and manage property listings
- Upload property images (Cloudinary integration)
- View bookings for owned properties
- Track listing approval status
- Manage property details and pricing

### For Administrators 👨‍💼
- Approve or reject property listings
- View comprehensive dashboard with analytics
- Manage all users, bookings, and listings
- Export data (listings, bookings, users) as CSV
- Monitor platform activity

## 🎯 Demo Credentials

Try the platform with these pre-configured demo accounts:

| Role | Username | Password | Access Level |
|------|----------|----------|--------------|
| **Admin** | `admin` | `admin123` | Full platform access, approve listings, view analytics |
| **Owner** | `owner` | `owner123` | Create/manage listings, view bookings |
| **Customer** | `customer` | `customer123` | Browse listings, make bookings, write reviews |

> 💡 **Tip**: Demo credentials are pre-filled on the login page for easy access!

## 🛠️ Tech Stack

**Backend:**
- Node.js v18.20.8
- Express.js v4.18.2
- MongoDB with Mongoose v8.20.0
- Passport.js (Local Strategy)
- Bcrypt for password hashing

**Frontend:**
- EJS templating engine
- Bootstrap 5
- Leaflet.js for interactive maps
- Custom CSS

**Cloud Services:**
- MongoDB Atlas (Database)
- Cloudinary (Image storage)
- Mapbox (Geocoding & Maps)

**Additional Features:**
- Session-based authentication with MongoDB store
- Joi validation
- Multer for file uploads
- Node-cron for scheduled tasks
- Flash messages for user feedback

## 📋 Prerequisites

- Node.js v18.20.8 or higher
- MongoDB Atlas account
- Cloudinary account
- Mapbox API token

## 🚀 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Yogiraj2005/SuiteSpot_Property-listing-website.git
   cd SuiteSpot-2.0
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   ATLASDB_URL=your_mongodb_atlas_connection_string
   SECRET=your_session_secret_key
   CLOUD_NAME=your_cloudinary_cloud_name
   CLOUD_API_KEY=your_cloudinary_api_key
   CLOUD_API_SECRET=your_cloudinary_api_secret
   MAP_TOKEN=your_mapbox_access_token
   NODE_ENV=development
   ```

4. **Seed demo users (optional)**
   ```bash
   node init/seedAdmin.js
   ```

5. **Start the application**
   ```bash
   npm start
   ```

6. **Access the application**
   
   Open your browser and navigate to: `http://localhost:8080`

## 📁 Project Structure

```
SuiteSpot-2.0/
├── models/              # Mongoose schemas (User, Listing, Booking, Review, Bill)
├── controllers/         # Business logic for routes
├── routes/             # Express route definitions
├── views/              # EJS templates
│   ├── listings/       # Listing views (index, show, edit, admin dashboard)
│   ├── bookings/       # Booking management views
│   ├── users/          # Authentication views
│   └── layouts/        # Shared layouts
├── public/             # Static assets (CSS, JS, images)
├── middleware.js       # Custom middleware (auth, validation)
├── schema.js           # Joi validation schemas
├── cloudConfig.js      # Cloudinary configuration
├── database.js         # MongoDB connection
└── app.js             # Application entry point
```

## 🔐 Security Features

- ✅ Password hashing with bcrypt
- ✅ Session-based authentication
- ✅ Role-based access control (RBAC)
- ✅ Input validation with Joi
- ✅ CSRF protection
- ✅ Secure session storage in MongoDB

## 🎨 Key Functionalities

### Listing Management
- Create listings with title, description, location, price, capacity
- Upload property images to Cloudinary
- Geocoding with Mapbox for accurate location mapping
- Add nearby locations with distances
- Admin approval workflow (Pending → Approved/Rejected)

### Booking System
- Date-based booking with start/end dates
- Automatic price calculation
- Booking status tracking (Pending → Confirmed/Cancelled)
- Auto-cancellation of pending bookings after 24 hours (cron job)

### Review System
- 5-star rating system
- Text reviews
- Cascade delete when listing is removed

### Admin Dashboard
- View all listings, bookings, and users
- Approve/reject listings
- Export data as CSV
- Platform analytics

## 🔄 Automated Tasks

The application includes a cron job that runs every hour to:
- Cancel pending bookings older than 24 hours
- Maintain data integrity

## 📱 Responsive Design

The platform is fully responsive and works seamlessly on:
- Desktop computers
- Tablets
- Mobile devices

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the ISC License.

## 👨‍💻 Author

**Yogiraj**
- GitHub: [@Yogiraj2005](https://github.com/Yogiraj2005)

## 🙏 Acknowledgments

- Original project inspiration from SahilShinde108
- Bootstrap for UI components
- Leaflet.js for mapping functionality
- MongoDB Atlas for database hosting
- Cloudinary for image management

---

**Note**: This is a demo project for educational purposes. Demo credentials are provided for easy exploration of the platform's features.
