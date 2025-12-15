const User = require('../models/user.js');

module.exports.renderSignupForm = (req, res) => {
    res.render("users/signup.ejs");
};

// Handle new user signup
module.exports.signup = async (req, res, next) => {
    try {
        const { username, email, password, role } = req.body;
        const newUser = new User({ email, username, role });
        const registeredUser = await User.register(newUser, password);
        req.login(registeredUser, (err) => {
            if (err) {
                return next(err);
            }
            req.flash("success", "Welcome to SuiteSpot!");
            res.redirect("/listings");
        });
    } catch (e) {
        req.flash("error", e.message);
        res.redirect("/signup");
    }
};

module.exports.renderLoginForm = (req, res) => {
    res.render("users/login.ejs");
};

// Handle user login
module.exports.login = (req, res) => {
    req.flash("success", "Welcome Back to SuiteSpot!");
    // Redirect user to the page they were trying to visit, or back to listings
    const redirectUrl = res.locals.redirectUrl || "/listings";
    res.redirect(redirectUrl);
};

// Handle user logout
module.exports.logout = (req, res, next) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }
        req.flash("success", "You have been successfully logged out!");
        res.redirect("/listings");
    });
};

module.exports.index = async (req, res) => {
    const allUsers = await User.find({});
    res.render("users/index.ejs", { allUsers });
};

