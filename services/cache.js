const mongoose = require("mongoose");
const redis = require("redis");
const utils = require("util");
const keys = require("../config/keys");
const client = redis.createClient(keys.redisUrl);
client.hget = utils.promisify(client.hget);
const exec = mongoose.Query.prototype.exec;

mongoose.Query.prototype.cache = function (options = {}) {
	this.useCache = true;
	this.hashKey = JSON.stringify(options.key || ""); //Make sure it is a string
	return this;
};

mongoose.Query.prototype.exec = async function () {
	if (!this.useCache) {
		return exec.apply(this, arguments);
	}
	const key = JSON.stringify(
		Object.assign({}, this.getQuery(), {
			collection: this.mongooseCollection.name,
		})
	);
	// see if we have a value for key in redis

	const cacheValue = await client.hget(this.hashKey, key);

	if (cacheValue) {
		const doc = JSON.parse(cacheValue); //not handling when cacheValue is an array of records
		return Array.isArray(doc)
			? doc.map((d) => new this.model(d))
			: new this.model(doc);
	}
	const result = await exec.apply(this, arguments);
	client.hset(this.hashKey, key, JSON.stringify(result));
	return result;
};

module.exports = {
	clearHash(hashKey) {
		client.del(JSON.stringify(hashKey));
	},
};
