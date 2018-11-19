GLOBAL.filter = function (filterinput) {
	if(typeof filterinput === 'string') {
		filterinput = sanitize(filterinput).trim();
		return filterinput;
	}else if(typeof filterinput === 'object'){
		for(key in filterinput){
			if(typeof filterinput[key] === 'string'){
				filterinput[key] = filter(filterinput[key]);
			}
		}
		return filterinput;
	}
};

var Schema = mongoose.Schema;
GLOBAL.ObjectId = mongoose.Types.ObjectId;

var offerSchema = new Schema({
	Vendor_Id: {type: String, trim: true},
    Offer_Title: {type: String, required: true, trim: true},
    Offer_Description: {type: String, trim: true},
    Offer_Badge_Text: {type: String, trim: true},
    Offer_Image: {type: String, trim: true},
    Offer_Type: {type: String, trim: true},
    Offer_Category: {type: String, trim: true},
    Offer_Extras: {type: String, trim: true},
    Offer_Discount_Type: {type: String, trim: true},
    Offer_Discount_Value: {type: String, trim: true},
    Offer_Timestamp: {type: String, trim: true},
    
},{
    toObject: { virtuals: true },
    toJSON: { virtuals: true }
});

var vendorSchema = new Schema({
	Vendor_Name: {type: String, required: true, trim: true},
    Vendor_Location: {type: String, trim: true},
    Vendor_Vicinity: {type: String, trim: true},
    Vendor_Types: {type: String, trim: true},
    Vendor_Logo: {type: String, trim: true},
    Vendor_Phone: {type: String, trim: true},
    Vendor_Email: {type: String, trim: true},
    Vendor_Website: {type: String, trim: true}
},{
    toObject: { virtuals: true },
    toJSON: { virtuals: true }
});

vendorSchema.virtual('Vendor_Id').get(function(){
	return this._id;
});
GLOBAL.Vendor = mongoose.model('vendor', vendorSchema);

offerSchema.virtual('Offer_Id').get(function(){
	return this._id;
});
GLOBAL.Offer = mongoose.model('offer', offerSchema);

