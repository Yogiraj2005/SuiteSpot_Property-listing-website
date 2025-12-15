const Bill = require('../models/bill');
const Booking = require('../models/booking');
const Listing = require('../models/listing');
const User = require('../models/user'); // Import the User model
const PDFDocument = require('pdfkit');

module.exports.showBills = async (req, res) => {
    console.log("Fetching bills for userId:", req.user._id);
    const bills = await Bill.find({ user: req.user._id })
        .populate({
            path: 'booking',
            populate: {
                path: 'listing'
            }
        })
        .sort({ issueDate: -1 });
    res.render('bills/index', { bills });
};

module.exports.showBill = async (req, res) => {
    const { id } = req.params;
    const bill = await Bill.findById(id)
        .populate({
            path: 'booking',
            populate: {
                path: 'listing'
            }
        });

    if (!bill) {
        req.flash('error', 'Bill not found!');
        return res.redirect('/billing');
    }

    // Ensure we compare strings or ObjectIds correctly
    if (!bill.user.equals(req.user._id)) {
        req.flash('error', 'You are not authorized to view this bill.');
        return res.redirect('/billing');
    }

    res.render('bills/show', { bill });
};

module.exports.generatePdfBill = async (req, res) => {
    const { id } = req.params;
    const bill = await Bill.findById(id)
        .populate({
            path: 'booking',
            populate: {
                path: 'listing'
            }
        })
        .populate('user');

    if (!bill) {
        req.flash('error', 'Bill not found!');
        return res.redirect('/billing');
    }

    if (!bill.user._id.equals(req.user._id)) {
        req.flash('error', 'You are not authorized to generate this bill.');
        return res.redirect('/billing');
    }

    const doc = new PDFDocument();
    const filename = 'bill-' + bill._id + '.pdf';

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="' + filename + '"');

    doc.pipe(res);

    doc.fontSize(25).text('SuiteSpot Bill', { align: 'center' });
    doc.moveDown();

    doc.fontSize(16).text(`Bill ID: ${bill._id}`);
    doc.text(`Issue Date: ${bill.issueDate.toLocaleDateString()}`);
    if (bill.dueDate) {
        doc.text(`Due Date: ${bill.dueDate.toLocaleDateString()}`);
    }
    doc.moveDown();

    // Add User Information
    doc.fontSize(18).text('Billed To:');
    doc.fontSize(14).text(`Username: ${bill.user.username}`);
    doc.text(`Email: ${bill.user.email}`);
    doc.moveDown();

    doc.fontSize(18).text('Booking Details:');
    if (bill.booking && bill.booking.listing) {
        doc.fontSize(14).text(`Listing: ${bill.booking.listing.title} (${bill.booking.listing.location})`);
        doc.text(`Booking ID: ${bill.booking._id}`);
        doc.text(`Check-in: ${bill.booking.startDate.toLocaleDateString()}`);
        doc.text(`Check-out: ${bill.booking.endDate.toLocaleDateString()}`);
        doc.text(`Total Price: ${bill.booking.totalPrice.toLocaleString("en-IN")} Rs`);
    } else {
        doc.text('Booking details not available.');
    }
    doc.moveDown();

    doc.fontSize(18).text('Payment Summary:');
    doc.fontSize(14).text(`Amount: ${bill.amount.toLocaleString("en-IN")} Rs`);
    // doc.text(`Status: ${bill.status}`);
    doc.moveDown();

    doc.end();
};