const { clearHash } = require("../services/cache");

module.exports = async (req, res, next) => {
	await next(); // wait for request handler (the last part)
	clearHash(req.user.id);
};
