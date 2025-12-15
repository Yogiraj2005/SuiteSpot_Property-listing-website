const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const bookingSchema = new Schema({
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  totalPrice: {
    type: Number,
    required: true,
    default: 0,
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled'],
    default: 'pending',
  },
  guest: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  listing: {
    type: Schema.Types.ObjectId,
    ref: "Listing",
  },
});

module.exports = mongoose.model("Booking", bookingSchema);