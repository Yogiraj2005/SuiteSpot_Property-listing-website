const mongoose = require('mongoose');
require('../database');
const User = require('../models/user');
const Listing = require('../models/listing');
const Review = require('../models/review');
const Booking = require('../models/booking');
const Bill = require('../models/bill');

async function seedData() {
    try {
        // Wait for MongoDB connection
        if (mongoose.connection.readyState === 0) {
            await new Promise((resolve) => {
                mongoose.connection.once('open', resolve);
            });
        }

        console.log('🌱 Starting data seeding...\n');

        // ============ CREATE SAMPLE USERS ============
        console.log('👥 Creating sample users...');

        // Clear existing sample users (keep demo users)
        await User.deleteMany({
            username: {
                $in: ['john_doe', 'jane_smith', 'mike_wilson', 'sarah_jones', 'alex_brown']
            }
        });

        const sampleUsers = [
            { username: 'john_doe', email: 'john@example.com', role: 'customer', password: 'password123' },
            { username: 'jane_smith', email: 'jane@example.com', role: 'customer', password: 'password123' },
            { username: 'mike_wilson', email: 'mike@example.com', role: 'owner', password: 'password123' },
            { username: 'sarah_jones', email: 'sarah@example.com', role: 'customer', password: 'password123' },
            { username: 'alex_brown', email: 'alex@example.com', role: 'customer', password: 'password123' }
        ];

        const createdUsers = [];
        for (const userData of sampleUsers) {
            const newUser = new User({
                username: userData.username,
                email: userData.email,
                role: userData.role
            });
            const registeredUser = await User.register(newUser, userData.password);
            createdUsers.push(registeredUser);
            console.log(`  ✓ Created ${userData.role}: ${userData.username}`);
        }

        // ============ GET EXISTING LISTINGS ============
        console.log('\n📋 Fetching existing listings...');
        const listings = await Listing.find({});

        if (listings.length === 0) {
            console.log('  ⚠️  No listings found. Please create some listings first.');
            await mongoose.connection.close();
            process.exit(0);
        }

        console.log(`  ✓ Found ${listings.length} existing listings`);

        // ============ CREATE REVIEWS ============
        console.log('\n⭐ Creating reviews for listings...');

        // Clear existing reviews
        await Review.deleteMany({});

        const reviewComments = [
            { rating: 5, comment: 'Absolutely amazing place! The location was perfect and the host was very accommodating.' },
            { rating: 4, comment: 'Great stay overall. The property was clean and well-maintained. Would recommend!' },
            { rating: 5, comment: 'Exceeded all expectations! Beautiful property with all amenities. Will definitely book again.' },
            { rating: 3, comment: 'Decent place, but could use some improvements. Location was good though.' },
            { rating: 4, comment: 'Very comfortable stay. The property matched the description perfectly.' },
            { rating: 5, comment: 'Perfect for our family trip! Spacious and close to all major attractions.' },
            { rating: 4, comment: 'Good value for money. Host was responsive and helpful throughout our stay.' },
            { rating: 5, comment: 'One of the best stays we\'ve had! Highly recommend this property.' }
        ];

        let reviewCount = 0;
        for (const listing of listings) {
            // Add 2-4 random reviews per listing
            const numReviews = Math.floor(Math.random() * 3) + 2;

            for (let i = 0; i < numReviews && i < createdUsers.length; i++) {
                const randomComment = reviewComments[Math.floor(Math.random() * reviewComments.length)];
                const review = new Review({
                    comment: randomComment.comment,
                    rating: randomComment.rating,
                    author: createdUsers[i]._id,
                    listing: listing._id,
                    createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) // Random date within last 30 days
                });

                await review.save();

                // Add review to listing's reviews array
                listing.reviews.push(review._id);
                reviewCount++;
            }

            await listing.save();
        }

        console.log(`  ✓ Created ${reviewCount} reviews across ${listings.length} listings`);

        // ============ CREATE BOOKINGS ============
        console.log('\n📅 Creating bookings...');

        // Clear existing bookings
        await Booking.deleteMany({});

        const bookings = [];
        let bookingCount = 0;

        for (let i = 0; i < Math.min(listings.length, 8); i++) {
            const listing = listings[i];
            const customer = createdUsers[i % createdUsers.length];

            // Create 1-2 bookings per listing
            const numBookings = Math.floor(Math.random() * 2) + 1;

            for (let j = 0; j < numBookings; j++) {
                const startDate = new Date();
                startDate.setDate(startDate.getDate() + Math.floor(Math.random() * 60) + 1); // 1-60 days from now

                const endDate = new Date(startDate);
                endDate.setDate(endDate.getDate() + Math.floor(Math.random() * 7) + 2); // 2-8 days stay

                const nights = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
                const totalPrice = listing.price * nights;

                const statuses = ['pending', 'confirmed', 'confirmed', 'confirmed']; // More confirmed bookings
                const status = statuses[Math.floor(Math.random() * statuses.length)];

                const booking = new Booking({
                    startDate,
                    endDate,
                    totalPrice,
                    status,
                    guest: customer._id,
                    listing: listing._id
                });

                await booking.save();
                bookings.push(booking);
                bookingCount++;
            }
        }

        console.log(`  ✓ Created ${bookingCount} bookings`);

        // ============ CREATE BILLS ============
        console.log('\n💰 Creating bills for bookings...');

        // Clear existing bills
        await Bill.deleteMany({});

        let billCount = 0;
        for (const booking of bookings) {
            const dueDate = new Date(booking.startDate);
            dueDate.setDate(dueDate.getDate() - 3); // Due 3 days before check-in

            const billStatuses = ['pending', 'paid', 'paid']; // More paid bills
            const status = billStatuses[Math.floor(Math.random() * billStatuses.length)];

            const bill = new Bill({
                amount: booking.totalPrice,
                issueDate: new Date(),
                dueDate,
                status,
                booking: booking._id,
                user: booking.guest
            });

            await bill.save();
            billCount++;
        }

        console.log(`  ✓ Created ${billCount} bills`);

        // ============ SUMMARY ============
        console.log('\n✅ Data seeding completed successfully!');
        console.log('\n📊 Summary:');
        console.log(`  • Users created: ${createdUsers.length}`);
        console.log(`  • Reviews created: ${reviewCount}`);
        console.log(`  • Bookings created: ${bookingCount}`);
        console.log(`  • Bills created: ${billCount}`);
        console.log(`  • Listings used: ${listings.length}`);

        console.log('\n🔐 Sample User Credentials:');
        console.log('  Username: john_doe    | Password: password123 | Role: Customer');
        console.log('  Username: jane_smith  | Password: password123 | Role: Customer');
        console.log('  Username: mike_wilson | Password: password123 | Role: Owner');
        console.log('  Username: sarah_jones | Password: password123 | Role: Customer');
        console.log('  Username: alex_brown  | Password: password123 | Role: Customer');

        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding data:', error);
        await mongoose.connection.close();
        process.exit(1);
    }
}

seedData();
