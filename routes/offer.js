var fs = require('fs')
	, knox = require('knox');

var allowedExtensions = [".jpg",".png"];
var allowedCategories = [ 
	                        {title : 'Arts & Crafts', icon: "exclamation-sign"}, 
							{title : 'Baby', icon: "exclamation-sign"}, 
							{title : 'Beauty', icon: "exclamation-sign"}, 
							{title : 'Clothing', icon: "exclamation-sign"}, 
							{title : 'Computers', icon: "exclamation-sign"}, 
							{title : 'Electronics', icon: "exclamation-sign"}, 
							{title : 'Food', icon: "exclamation-sign"}, 
							{title : 'Gadgets & Accessories', icon: "exclamation-sign"}, 
							{title : 'Health', icon: "exclamation-sign"}, 
							{title : 'Home & Kitchen', icon: "exclamation-sign"}, 
							{title : 'Jewelry', icon: "exclamation-sign"}, 
							{title : 'Mobiles', icon: "exclamation-sign"}, 
							{title : 'Office Products', icon: "exclamation-sign"}, 
							{title : 'Shoes', icon: "exclamation-sign"}, 
							{title : 'Sports & Fitness', icon: "exclamation-sign"}, 
							{title : 'TV & Entertainment', icon: "exclamation-sign"} 
						];

var offer_keys = common.getFields(Offer);
var filter_array = common.getStringFields(Offer);
var required_keys = common.getRequiredFields(Offer)

function isValidVendor(vendor_id, callback){
	// @todo: get list of vendors and verify vendor_id
	callback(true); 
}

/*
 * GET Offer Record
 */
exports.getOffer = function(req, res) {
	req.onValidationError(function(msg) {
		//Redirect the user with error 'msg'
	});

	vendor = req.params.vendor;
	offer = req.params.offer;
	
	var errorMsg = { status : 'Not Found' };
	
	console.log('\nGet Offer Record: ' + offer);
	Offer.findOne({Vendor_Id: vendor, _id: offer}, function(err, result){
		if(err) {
			console.log(err);
			res.jsonp(500, errorMsg);
		} else {
			console.log(result);
			if(result !== null){
				res.jsonp(result);
			} else {
				res.jsonp("");
			}
		}
	});
	
};

/*
 * Add Offer Record
 */
exports.addOffer = function(req, res) {
	req.onValidationError(function(msg) {
		//Redirect the user with error 'msg'
	});
	
	var errorMsg = {status : 'Insert failed.'};
	
	vendor = req.params.vendor;
	offer = uuid.v1();
	
	isValidVendor(vendor, function(isValid){
		if(isValid){
			/*
			 * Filter request object keys that are keys of offer attributes and
			 * have defined values 
			 */
			var parameters = req.body;
			if ((!_.isUndefined(req.query)) && (!_.isNull(req.query)) && (!_.isEmpty(req.query))) {
				parameters = req.query;
			}	
			
			var filtered_keys = _.filter(_.keys(parameters), function(key){
				return _.contains(offer_keys,key) && !_.isUndefined(parameters[key] && parameters[key]);
			});
			
			var canInsertOfferItem = true;
			_.each(required_keys, function(key){
				if(!_.contains(filtered_keys, key)) {
					canInsertOfferItem = false;
				}
			});
			
			if(canInsertOfferItem){
				// Pick request object values from filtered keys
				insertItem = _.pick(parameters,filtered_keys);
				insertItem["Vendor_Id"] = vendor;
				insertItem.Offer_Timestamp = ((new Date()).getTime() + ((new Date()).getTimezoneOffset() * 60000));
				
				// Sanitize
				_.each(filter_array, function(item){
					if( (!_.isUndefined(insertItem[item])) && insertItem[item]){
						insertItem[item] = filter(insertItem[item]);
					}
				});
				
				if((!_.isUndefined(req.files)) && (!_.isUndefined(req.files.Offer_Image))){
					var filename = req.files.Offer_Image.name;
					var extension = filename.substr(filename.lastIndexOf('.'),filename.length);
					if(_.contains(allowedExtensions,extension)) {
						uploadOfferImage(offer + extension, req.files.Offer_Image, function(err, result){
							if(err){
								console.log(err);
								res.jsonp(500, errorMsg);
							} else {
								console.log(result.msg);
								insertItem.Offer_Image = result.url;
								
								console.log('\nInserting Offer Record: ' + JSON.stringify(insertItem));
								var o = new Offer(insertItem);
								offer = o._id;
								o.save(function(err, result){
									if(err) {
										console.log(err);
										res.jsonp(500, errorMsg);
									} else {
										console.log(result);
										res.jsonp({status: "ok", id: offer});
									}
								});
							}
	
						});
					} else
						res.jsonp(500, errorMsg);
				} else {
					console.log('\nInserting Offer Record Without Logo: ' + JSON.stringify(insertItem));
					var o = new Offer(insertItem);
					offer = o._id;					
					o.save(function(err, result){
						if(err) {
							console.log(err);
							res.jsonp(500, errorMsg);
						} else {
							console.log(result);
							res.jsonp({status: "ok", id: offer});
						}
					});
				}
				
			} else {
				console.log("Cannot Insert Item");
				res.jsonp(500, errorMsg);
			}
		} else {
			console.log("Vendor Is not Valid!");
			res.jsonp(500, errorMsg);
		}
	});
	
};

function uploadOfferImage(id, image, callback){
	if (S3_STORAGE){
		var s3 = knox.createClient({
		    key: AWS_KEY,
		    secret: AWS_SECRET,
		    bucket: AWS_BUCKET
		});
		
		//var image = req.files.image;
	    var s3Headers = {
	      'Content-Type': image.type,
	      'Content-Length': image["length"],
	      'x-amz-acl': 'public-read'
	    };
	
	    s3.putFile(image.path, id , function(err, res){
			if (err) {
				console.log(err);
				callback('Failed to upload file to Amazon S3.', {msg: '', url: ''});
			} else if (200 === res.statusCode) { 
				callback('', {msg: 'Uploaded to Amazon S3.', url: res.socket._httpMessage.url || "" });
			} else {
				callback('Failed to upload file to Amazon S3.', {msg: '', url: ''}); 
			}
	    });
	} else {
		// Store to local disk and return path
		fs.readFile(image.path, function (err, data) {
			var newPath = __dirname + "/../public/uploads/offers/" + id;
			fs.writeFile(newPath, data, function (err) {
				url = "/uploads/offers/" + id;
				msg = "Uploaded to disk.";
				callback('', {msg: msg, url: url});
			});
		});
	}
}

/*
 * Update Offer Record
 */
exports.updateOffer = function(req, res) {
	req.onValidationError(function(msg) {
		//Redirect the user with error 'msg'
	});

	vendor = req.params.vendor;
	offer = req.params.offer;
	
	var errorMsg = { status : 'Update failed.' };
	
	isValidVendor(vendor, function(isValid){
		if(isValid){
			var parameters = req.body;
			if ((!_.isUndefined(req.query)) && (!_.isNull(req.query)) && (!_.isEmpty(req.query))) {
				parameters = req.query;
			}	
			
			// Filter request object keys that are keys of offer attributes 
			var filtered_keys = _.filter(_.keys(parameters), function(key){
				return _.contains(offer_keys,key)
			});
			
			// Pick request object values from filtered keys
			updateItem = _.pick(parameters,filtered_keys);
			updateItem.Offer_Timestamp = ((new Date()).getTime() + ((new Date()).getTimezoneOffset() * 60000));
			
			// Sanitize
			_.each(filter_array, function(item){
				if((!_.isUndefined(updateItem[item])) && updateItem[item]){
					updateItem[item] = filter(updateItem[item]);
				}
			});
			
			if((!_.isUndefined(req.files)) && (!_.isUndefined(req.files.Offer_Image)) && req.files.Offer_Image.size > 0){
				var filename = req.files.Offer_Image.name;
				var extension = filename.substr(filename.lastIndexOf('.'),filename.length);
				if(_.contains(allowedExtensions,extension)) {
					uploadOfferImage(offer + extension, req.files.Offer_Image, function(err, result){
						if(err) {
							console.log(err);
							res.jsonp(500, errorMsg);
						} else {
							console.log(result.msg);
							updateItem.Offer_Image = result.url;
							
							console.log('\nUpdating Offer Record: ' + JSON.stringify(updateItem));
							Offer.update({Vendor_Id: vendor, _id: offer} ,updateItem,{},function(err, result){
								if(err) {
									console.log(err);
									res.jsonp(500, errorMsg);
								} else {
									console.log(result);
									res.jsonp({status: "ok"});
								}
							});						
						}

					});
				} else
					res.jsonp(500, errorMsg);
			} else {
				// Customize updateItem for dynamodb update
				console.log('\nUpdating Offer Record: ' + JSON.stringify(updateItem));
				Offer.update({Vendor_Id: vendor, _id: offer},updateItem,{},function(err, result){
					if(err) {
						console.log(err);
						res.jsonp(500, errorMsg);
					} else {
						console.log(result);
						res.jsonp({status: "ok"});
					}
				});
			}
			
		} else
			res.jsonp(500, errorMsg);
	});
};

/*
 * Delete Offer Record
 */
exports.deleteOffer = function(req, res) {
	req.onValidationError(function(msg) {
		//Redirect the user with error 'msg'
	});

	vendor = req.params.vendor;
	offer = req.params.offer;
	
	var errorMsg = { status : 'Delete failed.' };
	
	isValidVendor(vendor, function(isValid){
		if(isValid){
			console.log('\nDelete Offer Record: ' + offer);
			
			Offer.findOne({Vendor_Id: vendor, _id: offer}, function(err, found){
				if(found != null){
					Offer.remove({Vendor_Id: vendor, _id: offer}, function(err){
						if(err) {
							console.log(err);
							res.jsonp(500, errorMsg);
						} else {
							// Delete from Amazon AWS
							if (S3_STORAGE){
								var s3 = knox.createClient({
								    key: AWS_KEY,
								    secret: AWS_SECRET,
								    bucket: AWS_BUCKET
								});
								s3.del(offer).on('response', function(response){
									  console.log(response.statusCode);
									  console.log(response.headers);
									  res.jsonp({status: "ok"});
								}).end();
							} else {
								// Delete from disk
								if(found.Offer_Image){
									var newPath = __dirname + "/../public" + offer;
									fs.unlink(newPath);
								}
								res.jsonp({status: "ok"});
							}
						}
					});
				} else {
					res.jsonp(500, errorMsg);
				}
			});
		} else
			res.jsonp(500, errorMsg);
	});

};

/*
 * Get All Offer Records
 */
exports.getAll = function(req, res) {
	req.onValidationError(function(msg) {
		//Redirect the user with error 'msg'
	});

	var errorMsg = { status : 'Not Found' };
	
	vendor = req.params.vendor; // Hash Key - Vendor ID
	
	console.log('\nGET All Offer Records for Company');
	Offer.find({Vendor_Id: vendor}, function(err, result){
		if(err) {
			console.log(err);
			res.jsonp(500, errorMsg);
		} else {
			console.log(result);
			if(result != null) {
					res.jsonp(result);
			} else 	
				res.jsonp("");
		}
	});
};

/*
 * Get Global Offers
 */
exports.getAllOffers = function(req, res){
	req.onValidationError(function(msg) {
		//Redirect the user with error 'msg'
	});
	
	var errorMsg = { status : 'Not Found' };
	var options = {};
	
	var offerType = req.query.type || "";
	if (offerType){
		options["Offer_Type"] = offerType;
	}
	
	Offer.find(options, function(err, data) {
		if (err) {
			console.log(err);
			res.jsonp(500, errorMsg);
		} else {
			console.log(JSON.stringify(data));
			if ((data != null) && data.length) {
				res.jsonp(data);
			} else 
				res.jsonp("");
		}
	});	
}

/*
 * Update View/Popularity Count of Offer
 */
exports.updateViewCount = function(req, res){
	req.onValidationError(function(msg) {
		//Redirect the user with error 'msg'
	});
	
	console.log("Received View Count Update Request");
	
	//Update View Count
	var offer = req.params.offer;
	var vendor = req.params.vendor;
	
	var errorMsg = { status : 'Error.' };
	
	console.log("Getting View Count: " + offer);
	Offer.findOne({Vendor_Id: vendor, _id: offer}, function(err, data){
		if(err) {
			console.log(err);
			res.jsonp(500, errorMsg);
		} else {
			console.log(JSON.stringify(data));
			var currentViewCount = 0;
			if(!_.isUndefined(data) && data.ViewCount){
				currentViewCount = parseInt(data.ViewCount);
			}
			var newViewCount = currentViewCount + 1;
			var offerUpdateItem = {};
			offerUpdateItem["ViewCount"] = newViewCount,
			Offer.update({Vendor_Id: vendor, _id: offer}, offerUpdateItem, {}, function(err, updateResult) {
				if (err) {
					console.log(err);
				}
				res.jsonp({status: "ok", msg: ""});
			});
		}
	});
}

exports.getCategories = function(req, res){
	res.jsonp(allowedCategories);
}