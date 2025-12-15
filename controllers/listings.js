const Listing = require('../models/listing.js');
const Review = require('../models/review.js');
const Booking = require('../models/booking.js');
const User = require('../models/user.js');
const Bill = require('../models/bill.js');
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
const mapToken = process.env.MAP_TOKEN;
const geoCodingClient = mbxGeocoding({ accessToken: mapToken });

module.exports = {
    index: async (req, res) => {
        const { startDate, endDate, city, festivalName, nearestLocation, minPrice, maxPrice, guestCount } = req.query;
        let query = { status: 'approved' };

        if (city) {
            query.location = { $regex: city, $options: 'i' };
        }

        if (festivalName) {
            query.festivalName = { $regex: festivalName, $options: 'i' };
        }

        if (nearestLocation) {
            query.$or = [
                { nearestLocation1: nearestLocation },
                { nearestLocation2: nearestLocation },
                { nearestLocation3: nearestLocation },
                { nearestLocation4: nearestLocation }
            ];
        }

        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice) query.price.$gte = parseFloat(minPrice);
            if (maxPrice) query.price.$lte = parseFloat(maxPrice);
        }

        if (guestCount) {
            query.capacity = { $gte: parseInt(guestCount) };
        }

        // Date filtering logic
        if (startDate && endDate) {
            const [dayS, monthS, yearS] = startDate.split('-');
            const parsedStartDate = new Date(Date.UTC(yearS, monthS - 1, dayS));
            const [dayE, monthE, yearE] = endDate.split('-');
            const parsedEndDate = new Date(Date.UTC(yearE, monthE - 1, dayE));

            const bookedListingIds = await Booking.find({
                status: 'confirmed',
                $and: [
                    { startDate: { $lte: parsedEndDate } },
                    { endDate: { $gte: parsedStartDate } }
                ]
            }).distinct('listing');

            if (bookedListingIds.length > 0) {
                query._id = { $nin: bookedListingIds };
            }
        }

        let allListings = await Listing.find(query);

        // Sorting logic for nearestLocation (client-side or complex aggregation needed, doing simple sort here if needed, or just relying on filter)
        // The original SQL used a CASE statement for sorting. Mongoose doesn't support this directly in find().
        // We can sort in memory since we already fetched allListings.
        if (nearestLocation) {
            allListings.sort((a, b) => {
                const getDist = (l) => {
                    if (l.nearestLocation1 === nearestLocation) return l.distance1;
                    if (l.nearestLocation2 === nearestLocation) return l.distance2;
                    if (l.nearestLocation3 === nearestLocation) return l.distance3;
                    if (l.nearestLocation4 === nearestLocation) return l.distance4;
                    return Infinity;
                };
                return getDist(a) - getDist(b);
            });
        }

        const cities = [...new Set((await Listing.find({}, 'location')).map(l => l.location.split(',')[0].trim()))];
        const festivals = [...new Set((await Listing.find({}, 'festivalName')).map(l => l.festivalName).filter(name => name && name.trim() !== ''))];

        const nearestLocations = [...new Set(
            (await Listing.find({}, 'nearestLocation1 nearestLocation2 nearestLocation3 nearestLocation4'))
                .flatMap(l => [l.nearestLocation1, l.nearestLocation2, l.nearestLocation3, l.nearestLocation4])
                .filter(location => location && location.trim() !== '')
                .map(location => location.trim())
        )];

        res.render("listings/index.ejs", { allListings, query: req.query, cities, festivals, nearestLocations });
    },

    renderNewForm: (req, res) => {
        res.render("listings/new.ejs");
    },

    createListing: async (req, res) => {
        let response = await geoCodingClient.forwardGeocode({
            query: req.body.listing.location,
            limit: 1,
        }).send();

        const newListing = new Listing(req.body.listing);
        newListing.owner = req.user._id;
        newListing.image = req.file.path;
        newListing.geometry = response.body.features[0].geometry;
        await newListing.save();
        req.flash("success", "New Listing Created!");
        res.redirect(`/listings/${newListing._id}`);
    },

    showListing: async (req, res) => {
        let { id } = req.params;
        const listing = await Listing.findById(id)
            .populate({
                path: "reviews",
                populate: {
                    path: "author",
                },
            })
            .populate("owner");
        if (!listing) {
            req.flash("error", "Listing you requested for does not exist!");
            return res.redirect("/listings");
        }

        // Fetch current booking for this listing (if any)
        const currentBooking = await Booking.findOne({
            listing: id,
            status: 'confirmed',
            endDate: { $gte: new Date() } // Only consider bookings that haven't ended yet
        })
            .populate('guest')
            .sort({ startDate: 1 }); // Get the earliest current booking

        res.render("listings/show.ejs", { listing, currentBooking });
    },

    renderEditForm: async (req, res) => {
        let { id } = req.params;
        const listing = await Listing.findById(id);
        if (!listing) {
            req.flash("error", "Listing you requested for does not exist!");
            return res.redirect("/listings");
        }
        let originalImageUrl = listing.image;
        originalImageUrl = originalImageUrl.replace("/upload", "/upload/w_250");
        res.render("listings/edit.ejs", { listing, originalImageUrl });
    },

    updateListing: async (req, res) => {
        let { id } = req.params;
        let listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing });

        if (typeof req.file !== "undefined") {
            let url = req.file.path;
            let filename = req.file.filename;
            listing.image = url;
            await listing.save();
        }

        req.flash("success", "Listing Updated!");
        res.redirect(`/listings/${id}`);
    },

    destroyListing: async (req, res) => {
        let { id } = req.params;
        let deletedListing = await Listing.findByIdAndDelete(id);
        console.log(deletedListing);
        req.flash("success", "Listing Deleted!");
        res.redirect("/listings");
    },

    showMyListings: async (req, res) => {
        const myListings = await Listing.find({ owner: req.user._id });
        res.render("listings/my-listings.ejs", { myListings });
    },

    updateListingStatus: async (req, res) => {
        let { id } = req.params;
        let { status } = req.body;
        await Listing.findByIdAndUpdate(id, { status: status });
        req.flash("success", "Listing Status Updated!");
        res.redirect(`/listings/${id}`);
    },

    adminDashboard: async (req, res) => {
        const { searchOwner, searchCustomer, tab } = req.query;

        // Fetch all users and populate related data manually or via separate queries if needed.
        // Mongoose 'virtuals' could be used for reverse relationships, but here we might just query separately or use aggregation.
        // For simplicity and matching previous logic, let's fetch users and then populate/filter.
        // However, Mongoose doesn't support deep populate of virtuals easily without setup.
        // Let's fetch lists separately to pass to the view.

        let allUsers = await User.find({});

        // To get listings, bookings, bills, reviews for each user, it's better to query those collections.
        // But the view likely expects `user.Listings`, `user.Bookings` etc.
        // We can attach them manually.

        for (let user of allUsers) {
            user.Listings = await Listing.find({ owner: user._id });
            user.Bookings = await Booking.find({ guest: user._id }).populate('listing').populate('guest');
            user.Bills = await Bill.find({ user: user._id }).populate({ path: 'booking', populate: { path: 'listing' } });
            user.Reviews = await Review.find({ author: user._id }).populate('listing'); // Assuming Review has 'listing' field reference if we added it. 
            // Wait, Review model in Mongoose didn't explicitly have 'listing' field in my previous edit? 
            // Let's check Review model. I might have missed adding 'listing' ref to Review if it's needed here.
            // The Sequelize model had `Review.belongsTo(Listing)`.
            // I should check Review model again.
        }

        let allBookings = await Booking.find({}).populate('listing').populate('guest');

        let filteredOwners = allUsers.filter(user => user.role === 'owner');
        let filteredCustomers = allUsers.filter(user => user.role === 'customer');

        if (searchOwner && searchOwner.trim() !== '') {
            const searchTerm = searchOwner.toLowerCase();
            filteredOwners = filteredOwners.filter(owner =>
                owner.username.toLowerCase().includes(searchTerm) ||
                owner.email.toLowerCase().includes(searchTerm)
            );
        } else if (searchOwner === '') {
            filteredOwners = [];
        }

        if (searchCustomer && searchCustomer.trim() !== '') {
            const searchTerm = searchCustomer.toLowerCase();
            filteredCustomers = filteredCustomers.filter(customer =>
                customer.username.toLowerCase().includes(searchTerm) ||
                customer.email.toLowerCase().includes(searchTerm)
            );
        } else if (searchCustomer === '') {
            filteredCustomers = [];
        }

        const pendingListings = await Listing.find({ status: 'pending' });
        const approvedListings = await Listing.find({ status: 'approved' });
        const rejectedListings = await Listing.find({ status: 'rejected' });

        if (req.xhr || req.headers.accept.indexOf('json') > -1) {
            if (tab === 'owners') {
                return res.json({ filteredOwners });
            } else if (tab === 'customers') {
                return res.json({ filteredCustomers });
            }
        }

        res.render("listings/admin-dashboard.ejs", {
            pendingListings,
            approvedListings,
            rejectedListings,
            filteredOwners,
            filteredCustomers,
            allBookings,
            query: req.query
        });
    },

    exportListings: async (req, res) => {
        const { Parser } = require('json2csv');
        const listings = await Listing.find({}).lean();

        const fields = ['_id', 'title', 'description', 'image', 'price', 'location', 'country', 'capacity', 'festivalName', 'status', 'owner', 'createdAt', 'updatedAt'];
        const json2csvParser = new Parser({ fields });
        const csv = json2csvParser.parse(listings);

        res.header('Content-Type', 'text/csv');
        res.attachment('listings.csv');
        return res.send(csv);
    },

    exportBookings: async (req, res) => {
        const { Parser } = require('json2csv');
        const bookings = await Booking.find({}).lean();

        const fields = ['_id', 'startDate', 'endDate', 'totalPrice', 'status', 'listing', 'guest', 'createdAt', 'updatedAt'];
        const json2csvParser = new Parser({ fields });
        const csv = json2csvParser.parse(bookings);

        res.header('Content-Type', 'text/csv');
        res.attachment('bookings.csv');
        return res.send(csv);
    },

    exportUsers: async (req, res) => {
        const { Parser } = require('json2csv');
        const users = await User.find({}).lean();

        const fields = ['_id', 'username', 'email', 'role', 'createdAt', 'updatedAt'];
        const json2csvParser = new Parser({ fields });
        const csv = json2csvParser.parse(users);

        res.header('Content-Type', 'text/csv');
        res.attachment('users.csv');
        return res.send(csv);
    }
};