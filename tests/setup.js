const { TextDecoder, TextEncoder } = require("util");

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
require("../models/User");
const mongoose = require("mongoose");
const keys = require("../config/keys");

mongoose.Promise = global.Promise; //use nodeJs
mongoose.connect(keys.mongoURI);
