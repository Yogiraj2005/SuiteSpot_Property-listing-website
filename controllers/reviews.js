const Listing = require("../models/listing.js");
const Review = require("../models/review.js");

// Create a new review
module.exports.createReview = async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findById(id);
    const { rating, comment } = req.body.review;
    
    const newReview = new Review({
        comment,
        rating,
        listing: listing._id,
        author: req.user._id
    });
    
    listing.reviews.push(newReview);
    
    await newReview.save();
    await listing.save();

    req.flash("success", "Created new review!");
    res.redirect(`/listings/${listing._id}`);
};

// Delete a review
module.exports.destroyReview = async (req, res) => {
    const { id, reviewId } = req.params;

    await Listing.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
    await Review.findByIdAndDelete(reviewId);
    
    req.flash("success", "Review Deleted!");
    res.redirect(`/listings/${id}`);
};
