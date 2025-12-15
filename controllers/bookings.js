const Listing = require('../models/listing.js');
const Review = require('../models/review.js');
const Booking = require('../models/booking.js');
const Bill = require('../models/bill');
const User = require('../models/user.js');

module.exports = {
    // Renders the page showing all of the current user's bookings
    showMyBookings: async (req, res) => {
        const myBookings = await Booking.find({ guest: req.user._id })
            .populate('listing');
        res.render("bookings/index.ejs", { myBookings });
    },

    // Handles the creation of a new booking with a date range
    createBooking: async (req, res) => {
        const { id: listingId } = req.params;
        const guestId = req.user._id;
        const { startDate, endDate } = req.body.booking;

        // Basic Validation: Ensure end date is after start date
        if (!startDate || !endDate || new Date(endDate) <= new Date(startDate)) {
            req.flash("error", "Invalid dates. Please ensure the end date is after the start date.");
            return res.redirect(`/listings/${listingId}`);
        }

        // Fetch the listing to get its price
        const listing = await Listing.findById(listingId);
        if (!listing) {
            req.flash("error", "Listing not found.");
            return res.redirect(`/listings`);
        }

        // Calculate the number of days and total price
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const totalPrice = diffDays * listing.price;

        // Check if user already has a booking that overlaps with the new booking dates
        // Mongoose query for overlapping dates
        const existingUserBooking = await Booking.findOne({
            guest: guestId,
            $or: [
                { startDate: { $gte: start, $lte: end } },
                { endDate: { $gte: start, $lte: end } },
                { $and: [
                    { startDate: { $lte: start } },
                    { endDate: { $gte: end } }
                ]}
            ]
        });

        if (existingUserBooking) {
            req.flash("error", "You already have a booking during these dates.");
            return res.redirect(`/listings/${listingId}`);
        }

        // Advanced Validation: Check for overlapping bookings
        const overlappingBooking = await Booking.findOne({
            listing: listingId,
            status: { $ne: 'cancelled' }, // Ignore cancelled bookings
            $or: [
                { startDate: { $gte: start, $lte: end } },
                { endDate: { $gte: start, $lte: end } },
                { $and: [
                    { startDate: { $lte: start } },
                    { endDate: { $gte: end } }
                ]}
            ]
        });

        if (overlappingBooking) {
            req.flash("error", "Sorry, this property is already booked for the selected dates.");
            return res.redirect(`/listings/${listingId}`);
        }

        // If validation passes, create the new booking
        const newBooking = new Booking({
            listing: listingId,
            guest: guestId,
            startDate,
            endDate,
            totalPrice,
            status: 'pending'
        });
        await newBooking.save();

        // Create a bill for the new booking
        console.log("Creating bill for guestId:", guestId);
        const newBill = new Bill({
            amount: totalPrice,
            booking: newBooking._id,
            user: guestId,
            dueDate: endDate
        });
        await newBill.save();

        req.flash("success", "Listing successfully booked and bill generated!");
        res.redirect(`/listings/${listingId}`);
    },

    showAllBookings: async (req, res) => {
        const allBookings = await Booking.find({})
            .populate('listing')
            .populate('guest');
        res.render("bookings/all-bookings-owner.ejs", { allBookings });
    },

    showAllBookingsForOwner: async (req, res) => {
        const ownerId = req.user._id;

        // Find all listings owned by the current user
        const ownerListings = await Listing.find({ owner: ownerId }, '_id');
        const listingIds = ownerListings.map(listing => listing._id);
        
        const allBookings = await Booking.find({
            listing: { $in: listingIds }
        })
        .populate('listing')
        .populate('guest');

        // Manually attach bills
        for (let booking of allBookings) {
            booking.Bill = await Bill.findOne({ booking: booking._id });
        }

        res.render("bookings/all-bookings.ejs", { allBookings });
    }
};

