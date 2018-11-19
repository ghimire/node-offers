/**
 * Module dependencies.
 */

var express = require('express')
, http = require('http')
, Validator = require('validator').Validator
, Filter = require('validator')
, path = require('path')
, redis = require('redis')
, RedisStore = require('connect-redis')(express);

GLOBAL.fs = require('fs');
GLOBAL._ = require('underscore')._;
GLOBAL.check = require('validator').check;
GLOBAL.sanitize = require('validator').sanitize;
GLOBAL.uuid = require('node-uuid');
GLOBAL.async = require('async');
GLOBAL.config = require('./config');
GLOBAL.common = require('./routes/common');

// Set up Redis
GLOBAL.client = redis.createClient();
client.on("error", function (err) {
    console.log("Redis error event - " + client.host + ":" + client.port + " - " + err);
});

GLOBAL.LANDING_PAGE = "offer";

// Handle Global Exceptions
process.on('uncaughtException', function (error) {
	   console.log(error.stack);
});

// Initialize express
var app = express();

GLOBAL.MODE = "DEVELOPMENT";
GLOBAL.CLIENTURL = "http://127.0.0.1";
GLOBAL.CLIENTPORT = ":8888";

app.configure('development', function() {
	app.use(express.errorHandler());
	
	GLOBAL.MODE = "DEVELOPMENT";
	GLOBAL.CLIENTPORT = ":8888";
});

//Middleware: Allows cross-domain requests (CORS)
var allowCrossDomain = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');

    next();
};

app.configure(function() {
	app.set('port', process.env.PORT || 8880);
	
	if(MODE === "DEVELOPMENT") app.set('port', process.env.PORT || 8888);
	console.log("Mode: " + MODE);
	
	app.use(express.favicon());
	app.use(express.logger('dev'));
	app.use(express.bodyParser());
	app.use(express.methodOverride());
	app.use(express.cookieParser());
	
	// Enable this for Production
	// app.use(express.session({ store: new RedisStore, secret: '0KarZ883M62vb8MYj9e1l8oF7yCFFxhW9UjNFNv1ZKo40IhgClyZ0Yl2CS9Pahx', maxAge: 365 * 24 * 60 * 60 * 1000 }));
	
	// Enable this for Development
	app.use(express.session({secret: '0KarZ883M62vb8MYj9e1l8oF7yCFFxhW9UjNFNv1ZKo40IhgClyZ0Yl2CS9Pahx', maxAge: 365 * 24 * 60 * 60 * 1000 }));
	
	app.use(allowCrossDomain);
	app.use(app.router);
	app.use(express.static(path.join(__dirname, 'public')));
});

// Start Routes Setup

// Remove www. from url
app.get('/*', function(req, res, next) {
	if(_.isUndefined(req.headers.host)) { next(); }
	
	if (req.headers.host.match(/^www/) !== null) {
		res.redirect('http://' + req.headers.host.replace(/^www\./, '') + req.url);
		return;
	} else {
		next();
	}
});

/*** Page Routes ****/

// Handle index page
app.get('/', function(req, res){	
	res.redirect('/' + LANDING_PAGE);
});

app.get('/offer', function(req, res){
	res.render('offer.ejs', {
		layout:false
	});
});
/*** End of Page Routes ****/

/*
 * Bind node-validator to express req object
 */

var validator = new Validator();

http.IncomingMessage.prototype.mixinParams = function() {
	this.params = this.params || {};
	this.query = this.query || {};
	this.body = this.body || {};
	//Merge params from the query string
	for ( var i in this.query) {
		if (typeof this.params[i] === 'undefined') {
			this.params[i] = this.query[i];
		}
	}

	//Merge params from the request body
	for ( var i in this.body) {
		if (typeof this.params[i] === 'undefined') {
			this.params[i] = this.body[i];
		}
	}
};

http.IncomingMessage.prototype.check = function(param, fail_msg) {
	return validator.check(this.params[param], fail_msg);
};

http.IncomingMessage.prototype.checkHeader = function(param, fail_msg) {
	var to_check;
	if (header === 'referrer' || header === 'referer') {
		to_check = this.headers['referer'];
	} else {
		to_check = this.headers[header];
	}
	return validator.check(to_check || '', fail_msg);
};
http.IncomingMessage.prototype.onValidationError = function(errback) {
	validator.error = errback;
};
http.IncomingMessage.prototype.filter = function(param) {
	var self = this;
	var filter = new Filter();
	filter.modify = function(str) {
		this.str = str;
		self.params[param] = str; //Replace the param with the filtered version
	};
	return filter.sanitize(this.params[param]);
};
//Create some aliases - might help with code readability
http.IncomingMessage.prototype.sanitize = http.IncomingMessage.prototype.filter;
http.IncomingMessage.prototype.assert = http.IncomingMessage.prototype.check;

// *** Setup Mongoose ***
GLOBAL.mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1/nodeoffersdb');

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function callback () {
	//Include global schema and model definitions
	eval(fs.readFileSync('globals.js')+'');

	vendor = require('./routes/vendor')
	, offer = require('./routes/offer')	
	
	// Include API Routes
	eval(fs.readFileSync('routes.js')+'');

	// Start HTTP + Express server
	http.createServer(app).listen(app.get('port'), function() {
		console.log("Express server listening on port " + app.get('port'));
	});
	
});
// End of Mongoose Setup

