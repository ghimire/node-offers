var fs = require('fs')
	, knox = require('knox');

var allowedExtensions = [".jpg",".png"];

var vendor_keys = common.getFields(Vendor);
var filter_array = common.getStringFields(Vendor);
var required_keys = common.getRequiredFields(Vendor);

/*
 * GET Vendor Record
 */
exports.getVendor = function(req, res) {
	req.onValidationError(function(msg) {
		//Redirect the user with error 'msg'
	});

	vendor = req.params.vendor;
	
	var errorMsg = { status : 'Not Found' };
	
	console.log('\nGet Vendor Record: ' + vendor);
	Vendor.findOne({_id: vendor},function(err, result){
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
 * Add Vendor Record 
 */
exports.addVendor = function(req, res) {
	req.onValidationError(function(msg) {
		//Redirect the user with error 'msg'
	});
	
	var errorMsg = {status : 'Insert failed.'};
	vendor = uuid.v1();
	
	/*
	 * Filter request object keys that are keys of vendor attributes and
	 * have defined values 
	 */
	var parameters = req.body;
	if ((!_.isUndefined(req.query)) && (!_.isNull(req.query)) && (!_.isEmpty(req.query))) {
		parameters = req.query;
	}	
	
	var filtered_keys = _.filter(_.keys(parameters), function(key){
		return _.contains(vendor_keys,key) && !_.isUndefined(parameters[key] && parameters[key]);
	});
	
	var canInsertVendorItem = true;
	_.each(required_keys, function(key){
		if(!_.contains(filtered_keys, key)) {
			canInsertVendorItem = false;
		}
	});
	
	if(canInsertVendorItem){
		// Pick request object values from filtered keys
		insertItem = _.pick(parameters,filtered_keys);
		
		// Sanitize
		_.each(filter_array, function(item){
			if( (!_.isUndefined(insertItem[item])) && insertItem[item]){
				insertItem[item] = filter(insertItem[item]);
			}
		});
		
		if((!_.isUndefined(req.files)) && (!_.isUndefined(req.files.Vendor_Logo)) && req.files.Vendor_Logo.size > 0){
			
			var filename = req.files.Vendor_Logo.name;
			var extension = filename.substr(filename.lastIndexOf('.'),filename.length);
			if(_.contains(allowedExtensions,extension)) {
				uploadVendorLogo(vendor + extension, req.files.Vendor_Logo, function(err, result){
					if(err){
						console.log(err);
						res.jsonp(500, errorMsg);
					} else {
						console.log(result.msg);
						insertItem.Vendor_Logo = result.url;
						
						console.log('\nInserting Vendor Record: ' + JSON.stringify(insertItem));
						var v = new Vendor(insertItem);
						vendor = v._id;
						v.save(function(err, result){
							if(err) {
								console.log(err);
								res.jsonp(500, errorMsg);
							} else {
								console.log(result);
								res.jsonp({status: "ok", id: vendor});
							}
						});
					}
				});
			} else {
				console.log("Extension not permitted.");
				res.jsonp(500, errorMsg);
			}
		} else {
			console.log('\nInserting Vendor Record Without Logo: ' + JSON.stringify(insertItem));
			var v = new Vendor(insertItem);
			vendor = v._id;
			v.save(function(err, result){
				if(err) {
					console.log(err);
					res.jsonp(500, errorMsg);
				} else {
					console.log(result);
					res.jsonp({status: "ok", id: vendor});
				}
			});		
		}
	} else {
		console.log("Cannot Insert Vendor");
		res.jsonp(500, errorMsg);
	}
};

function uploadVendorLogo(id, logo, callback){
	if (S3_STORAGE){
		var s3 = knox.createClient({
		    key: AWS_KEY,
		    secret: AWS_SECRET,
		    bucket: AWS_BUCKET
		});
		
		//var logo = req.files.logo;
	    var s3Headers = {
	      'Content-Type': logo.type,
	      'Content-Length': logo["length"],
	      'x-amz-acl': 'public-read'
	    };
	
	    s3.putFile(logo.path, id , function(err, res){
			if (err) {
				console.log(err);
				callback('Failed to upload file to Amazon S3.', {msg: '', url: ''});
			} else if (200 === res.statusCode) {
				callback('', {msg: 'Uploaded to Amazon S3.', url: res.socket._httpMessage.url || ""});
			} else {
				callback('Failed to upload file to Amazon S3.', {msg: '', url: ''}); 
			}
	    });
	} else {
		// Store to local disk and return path
		fs.readFile(logo.path, function (err, data) {
			if(err) {
				console.log(err)
				callback("Failed to upload the logo.",{msg: '', url: ''});
			} else {
				var newPath = __dirname + "/../public/uploads/vendors/" + id;
				console.log("Logo Path: " + logo.path)
				console.log("New Path: " + newPath)
				
				fs.writeFile(newPath, data, function (err) {
					if(err) {
						console.log(err);
						callback("Failed to upload the logo.",{msg: '', url: ''});
					} else {
						url = "/uploads/vendors/" + id;
						msg = "Uploaded to disk.";
						callback('', {msg: msg, url: url});
					}
				});
			}
		});
	}
}


/*
 * Update Vendor Record
 */
exports.updateVendor = function(req, res) {
	req.onValidationError(function(msg) {
		//Redirect the user with error 'msg'
	});

	vendor = req.params.vendor;
	
	var parameters = req.body;
	if ((!_.isUndefined(req.query)) && (!_.isNull(req.query)) && (!_.isEmpty(req.query))) {
		parameters = req.query;
	}	
	
	// Filter request object keys that are keys of vendor attributes 
	var filtered_keys = _.filter(_.keys(parameters), function(key){
		return _.contains(vendor_keys,key)
	});
	
	// Pick request object values from filtered keys
	updateItem = _.pick(parameters,filtered_keys);
	
	// Sanitize
	_.each(filter_array, function(item){
		if( (!_.isUndefined(updateItem[item])) && updateItem[item] ){
			updateItem[item] = filter(updateItem[item]);
		}
	});
	
	var errorMsg = { status : 'Update failed' };
	
	if((!_.isUndefined(req.files)) && (!_.isUndefined(req.files.Vendor_Logo)) && req.files.Vendor_Logo.size > 0){
		var filename = req.files.Vendor_Logo.name;
		var extension = filename.substr(filename.lastIndexOf('.'),filename.length);
		if(_.contains(allowedExtensions,extension)) {
			uploadVendorLogo(vendor + extension, req.files.Vendor_Logo, function(err, result){
				if(err){
					console.log(err);
					res.jsonp(500, errorMsg);
				} else{
					console.log(result.msg);
					updateItem.Vendor_Logo = result.url;
					
					console.log('\nUpdating Vendor Record: ' + JSON.stringify(updateItem));
					Vendor.update({_id: vendor}, updateItem,{},function(err, result){
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
		console.log('\nUpdating Vendor Record Without Logo: ' + JSON.stringify(updateItem));
		Vendor.update({_id: vendor},updateItem,{},function(err, result){
			if(err) {
				console.log(err);
				res.jsonp(500, errorMsg);
			} else {
				console.log(result);
				res.jsonp({status: "ok"});
			}
		});
	}

};

function deleteOffer(offer, done){
	console.log('\nDelete Offer Record: ' + offer.Id);
	Offer.findOne({Vendor_Id: offer.Vendor_Id, _id: offer.Id}, function(err, found){
		if(found != null){
			Offer.remove({Vendor_Id: offer.Vendor_Id, _id: offer.Id}, function(err){
				if(err) {
					done();
				} else {
					if(S3_STORAGE){
						var s3 = knox.createClient({
						    key: AWS_KEY,
						    secret: AWS_SECRET,
						    bucket: AWS_BUCKET
						});
						s3.del(offer.Id).on('response', function(res){
							  console.log(res.statusCode);
							  console.log(res.headers);
							  done();
						}).end();
					} else {
						if(found.Offer_Image){
							var newPath = __dirname + "/../public" + found.Offer_Image;
							fs.unlink(newPath);
						}				
						done();
					}
				}
			});			
		} else {
			done();
		}
	});
	
}

/*
 * Delete Vendor Record
 */
exports.deleteVendor = function(req, res) {
	req.onValidationError(function(msg) {
		//Redirect the user with error 'msg'
	});

	vendor = req.params.vendor;
	
	var errorMsg = { status : 'Delete failed.' };
	
	Vendor.findOne({_id: vendor}, function(err, found){
		if(found != null){
			console.log('\nDelete Vendor Record: ' + vendor);
			
			Vendor.remove({_id: vendor}, function(err){
				if(err) {
					console.log(err);
					res.jsonp(500, errorMsg);
				} else {
					// Also delete Offers
					// First scan and then delete each record
					console.log('\nGET All Offers for Vendor ' + vendor);
					Offer.find({Vendor_Id: vendor}, function(err, result){
						if(err) {
							console.log(err);
							res.jsonp(500, errorMsg);
						} else {
							// Iterate each offer record and delete
							console.log(result);
							if(result != null) {
									var offer = _.map(result, function(r){ return r.toObject(); });
									async.forEachSeries(offer, deleteOffer, function(err){
										console.log(result);
										
										if(S3_STORAGE){
											var s3 = knox.createClient({
											    key: AWS_KEY,
											    secret: AWS_SECRET,
											    bucket: AWS_BUCKET
											});
											s3.del(vendor).on('response', function(response){
												  console.log(response.statusCode);
												  console.log(response.headers);
												  res.jsonp({status: "ok"});
											}).end();
										} else {
											if(found.Vendor_Logo){
												var newPath = __dirname + "/../public" + found.Vendor_Logo
												fs.unlink(newPath);
											}
											res.jsonp({status: "ok"});
										}
										
									});
							} else 
								res.jsonp({status: "ok"});
						}
					});
					
				}
			});
		} else {
			res.jsonp(errorMsg);
		}
	});
};

/*
 * Get All Vendor Records
 */
exports.getAll = function(req, res) {
	req.onValidationError(function(msg) {
		//Redirect the user with error 'msg'
	});

	var errorMsg = { status : 'Not Found' };
	
	console.log('\nGET All Vendor Records');
	Vendor.find({},function(err, result){
		if(err) {
			console.log(err);
			res.jsonp(500, errorMsg);
		} else {
			console.log(result);
			if(result != null) {
					res.jsonp(result);
			} else 	res.jsonp("");
		}
	});
};


/*
 * Get Global Vendors
 */
exports.getAllVendors = function(req, res){
	req.onValidationError(function(msg) {
		//Redirect the user with error 'msg'
	});
	
	var errorMsg = { status : 'Not Found' };
	
	var options = {};
	console.log('\nGET Global Vendors');
	Vendor.find(options, function(err, data) {
		if (err) {
			console.log(err);
			res.jsonp(500, errorMsg);
		} else {
			console.log(JSON.stringify(data));
			if ( (data != null) && data.length) {
				res.jsonp(data);
			} else 
				res.jsonp("[]");
		}
	});
}