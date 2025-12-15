const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const billSchema = new Schema({
  amount: {
    type: Number,
    required: true,
  },
  issueDate: {
    type: Date,
    default: Date.now,
  },
  dueDate: {
    type: Date,
  },
  status: {
    type: String,
    enum: ['pending', 'paid', 'overdue'],
    default: 'pending',
  },
  booking: {
    type: Schema.Types.ObjectId,
    ref: "Booking",
    required: true,
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  pdfPath: {
    type: String,
  },
});

module.exports = mongoose.model("Bill", billSchema);