const mongoose = require("mongoose");

const User = mongoose.model("User");

module.exports = async () => {
	return new User({}).save(); //Not using googleId so we don't fill it up
};
