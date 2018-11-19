function init() {
	oVM = new offerViewModel();
	ko.applyBindings(oVM);
}

function nl2br (str, is_xhtml) {
    var breakTag = (is_xhtml || typeof is_xhtml === 'undefined') ? '<br />' : '<br>';
    return (str + '').replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1' + breakTag + '$2');
}

function showMsg(msg, success){
	$('html,body').animate({scrollTop: $("#alertbox").offset().top});
	
	var headerText = "<div class='alert alert-block alert-error fade in'>";
	if(success) headerText = "<div class='alert alert-block alert-success fade in'>";
	
	$("#alertbox").html(headerText +
			"<button type='button' class='close' data-dismiss='alert'>&times;</button>" +
			msg +
	"</div>");
	
	return success;
}

function offerViewModel() {
	var self = this,
		baseUri = OFFER_API_URL + 'vendor/';
	
	self.offers = ko.observableArray();
	self.vendors = ko.observableArray();
	self.dummyVendor = ko.observable();
	self.selectedVendor = ko.observable();
	self.selectedOffer = ko.observable();
	self.availableCategories = ko.observableArray();
	
	self.offerUpdating = ko.observable(false);
	self.specialOfferUpdating = ko.observable(false);
	self.vendorUpdating = ko.observable(false);
	self.offerDisplaying = ko.observable(false);
	self.vendorDisplaying = ko.observable(false);
	self.loadingOffers = ko.observable();
	self.loadingVendors = ko.observable();
	self.canCreateOffer = ko.observable(false);
	self.canCreateSpecialOffer = ko.observable(false);
	
	self.MAX_SIZE = 512000;
	self.OFFER_IMAGE_HEIGHT = 200;
	self.OFFER_IMAGE_WIDTH = 200;
	self.OFFER_SPECIAL_IMAGE_WIDTH = 480;
	
	self.VENDOR_IMAGE_HEIGHT = 145;
	self.VENDOR_IMAGE_WIDTH = 305;
	
	self.search = ko.observable("");
	/********* Pagination Code ************/
    self.pageSize = ko.observable(5);
    self.pageIndex = ko.observable(0);
 
    self.pagedList = ko.dependentObservable(function () {
        var size = self.pageSize();
        var start = self.pageIndex() * size;
        
        if (self.search()) {
        	return _(_.filter(self.offers(), function(item){
        		return ~(item.Offer_Title.toLowerCase().indexOf(self.search().toLowerCase()));
        	}).slice(start, start + size)).sortBy('Offer_Timestamp');
        }
        else return _(self.offers.slice(start, start + size)).sortBy('Offer_Timestamp');
    });
    self.maxPageIndex = ko.dependentObservable(function () {
    	if (self.search()) {
    		return Math.ceil(_.filter(self.offers(), function(item){
        		return ~(item.Offer_Title.toLowerCase().indexOf(self.search().toLowerCase()));
        	}).length/self.pageSize())-1;
    	}
        return Math.ceil(self.offers().length/self.pageSize())-1;
    });
    self.previousPage = function () {
        if (self.pageIndex() > 0) {
            self.pageIndex(self.pageIndex() - 1);
        }
    };
    self.nextPage = function () {
        if (self.pageIndex() < self.maxPageIndex()) {
            self.pageIndex(self.pageIndex() + 1);
        }
    };
    self.allPages = ko.dependentObservable(function () {
        var pages = [];
        for (i = 0; i <= self.maxPageIndex() ; i++) {
            pages.push({ pageNumber: (i + 1) });
        }
        return pages;
    });
    self.moveToPage = function (index) {
        self.pageIndex(index);
    };	

    self.search.subscribe(function() {
    	self.pageIndex(0);
    });
    /********* End of Pagination Code ************/
    self.uploadVendor = function(vendor){
    	self.clearMsg();

    	$("#vendorSaveButton").attr('disabled','');
    	$("#vendorCancelButton").attr('disabled','');
    	$("#vendorSaveButton i").removeClass('icon-ok');
    	$("#vendorSaveButton i").addClass('icon-spin');
    	$("#vendorSaveButton i").addClass('icon-spinner');    	
    	
        var formData = new FormData($('#vendorForm')[0]);
        var postURL = baseUri + 'add';
        
        if((!_.isUndefined(vendor.Vendor_Id)) && (self.isUUID(vendor.Vendor_Id))) {
        	postURL = baseUri + vendor.Vendor_Id + '/update';
        }
        $.ajax({
            url: postURL,  //server script to process data
            type: 'POST',
            beforeSend: self.vendorBeforeSendHandler,
            success: self.vendorSuccessHandler,
            error: self.vendorErrorHandler,
            complete: self.vendorCompleteHandler,
            data: formData,
            cache: false,
            contentType: false,
            processData: false
        });

    }
    
    self.vendorBeforeSendHandler = function(){
    	if((document.getElementById("Vendor_Logo")).files.length){
    		return true;
    	} else {
    		if(self.selectedVendor().Vendor_Logo){
    			return true;
    		} else {
    			self.vendorCompleteHandler();
    			return confirm("Are you sure you want to proceed without Vendor Logo?");
    		}
    	}
    }
    
    self.vendorErrorHandler = function(){
    	showMsg("Error while uploading vendor.", false)
    }
    
    self.vendorSuccessHandler = function(){
    	showMsg("Success.", true);
    }
    
    self.vendorCompleteHandler = function(){
    	self.vendorUpdating(false);
    	self.selectedVendor(undefined);
    	self.loadVendors();
    	
    	$("#vendorSaveButton").removeAttr('disabled');
    	$("#vendorCancelButton").removeAttr('disabled');
    	$("#vendorSaveButton i").removeClass('icon-spin');
    	$("#vendorSaveButton i").removeClass('icon-spiner');
    	$("#vendorSaveButton i").addClass('icon-ok');
    }    
    
    self.uploadOffer = function(newOffer){
    	self.clearMsg();
    	
    	var offer = {};
    	_.extend(offer, newOffer);
    	
    	if(self.specialOfferUpdating()){
    		_.extend(offer, {Offer_Type: "special"});
    	}
    	
    	//console.log("Offer: " + JSON.stringify(offer));
    	//return;
    	
    	$("#offerSaveButton").attr('disabled','');
    	$("#offerCancelButton").attr('disabled','');
    	$("#offerSaveButton i").removeClass('icon-ok');
    	$("#offerSaveButton i").addClass('icon-spin');
    	$("#offerSaveButton i").addClass('icon-spinner');
    	
        var formData = new FormData($('#offerForm')[0]);
        var postURL = baseUri + self.selectedVendor().Vendor_Id + "/offer/add";
        
        if((!_.isUndefined(offer.Id)) && (self.isUUID(offer.Id))) {
        	postURL = baseUri + self.selectedVendor().Vendor_Id + "/offer/" + offer.Id + '/update';
        }
        $.ajax({
            url: postURL,  //server script to process data
            type: 'POST',
            beforeSend: self.offerBeforeSendHandler,
            success: self.offerSuccessHandler,
            error: self.offerErrorHandler,
            complete: self.offerCompleteHandler,
            data: formData,
            cache: false,
            contentType: false,
            processData: false
        });
    }

    self.offerBeforeSendHandler = function(){
    	if((document.getElementById("Offer_Image")).files.length){
    		return true;
    	} else {
    		if(self.selectedOffer().Offer_Image){
    			return true;
    		} else {
	    		showMsg("Offer Image missing.", false);
	    		self.offerCompleteHandler();
	    		return false;
    		}
    	}
    }
    
    self.offerErrorHandler = function(){
    	showMsg("Error while uploading offer.", false)
    }
    
    self.offerSuccessHandler = function(){
    	showMsg("Success.", true);
    }
    
    self.offerCompleteHandler = function(){
    	self.specialOfferUpdating(false);
    	self.offerUpdating(false);
    	self.selectedOffer(undefined);
    	self.loadOffers();
    	
    	$("#offerSaveButton").removeAttr('disabled');
    	$("#offerCancelButton").removeAttr('disabled');
    	$("#offerSaveButton i").removeClass('icon-spin');
    	$("#offerSaveButton i").removeClass('icon-spiner');
    	$("#offerSaveButton i").addClass('icon-ok');
    }
    
    self.deleteVendor = function(){
    	if(confirm("Are you sure you want to delete this vendor?")) {
	    	//console.log(JSON.stringify(self.selectedVendor()));
	    	vendor = self.selectedVendor();
	    	//return;
	    	if((!_.isUndefined(vendor.Vendor_Id)) && (self.isUUID(vendor.Vendor_Id))) {
				$.ajax({
					type : "DELETE",
					url : baseUri + vendor.Vendor_Id + '/delete',
					data : vendor
				}).done(function(){
					showMsg(vendor.Vendor_Name +" deleted.", true);
					self.hideAll()
					self.loadVendors();
				}).fail(function(xhr, status, error){
					//showMsg($.parseJSON(xhr.responseText).status,false);
					showMsg("Delete failure.", false)
					self.hideAll();
				});
	    	} else {
	    		showMsg("Delete failure.", false)
	    	}
    	}
    }
    
    self.deleteOffer = function(){
    	if(confirm("Are you sure you want to delete this offer?")) {
	    	offer = self.selectedOffer();
	    	//return;
	    	if((!_.isUndefined(offer.Id)) && (self.isUUID(offer.Id))) {
				$.ajax({
					type : "DELETE",
					url : baseUri + self.selectedVendor().Vendor_Id + "/offer/" + offer.Id + '/delete',
					data : offer
				}).done(function(){
					showMsg(offer.Offer_Title +" deleted.", true);
					self.hideAll();
					self.loadOffers();
				}).fail(function(xhr, status, error){
					//showMsg($.parseJSON(xhr.responseText).status,false);
					showMsg("Delete failure.", false)
					self.hideAll();
				});
	    	} else {
	    		showMsg("Delete failure.", false)
	    	}
    	}
    }    
    
    self.loadVendors = function(){
    	self.loadingVendors(true);
    	self.selectedVendor(undefined);
    	self.dummyVendor(undefined);
    	
		$.getJSON(baseUri, function(vendors){
			vendors = _(vendors || []).sortBy("Vendor_Name");
			// Map to avoid image caching
			var mappedVendors = _.map(vendors, function(vendor){
				if((!_.isUndefined(vendor.Vendor_Logo)) && vendor.Vendor_Logo){
					vendor.Vendor_Logo = vendor.Vendor_Logo + "?" + Math.floor((Math.random()*100000)+1);
				}
				return vendor;
			});
			self.vendors(mappedVendors);
			self.loadingVendors(false);
		});
    }
    
    self.loadOffers = function(){
    	self.loadingOffers(true);
    	self.selectedOffer(undefined);
    	
		$.getJSON(baseUri + self.selectedVendor().Vendor_Id + "/offer/", function(offers){
			offers = offers || [];
			// Map to avoid image caching
			var mappedOffers = _.map(offers, function(offer){
				if((!_.isUndefined(offer.Offer_Image)) && offer.Offer_Image){
					offer.Offer_Image = offer.Offer_Image + "?" + Math.floor((Math.random()*100000)+1);
				}
				return offer;
			});
			self.offers(mappedOffers);
			self.loadingOffers(false);
		});
    }
    
    self.dummyVendor.subscribe(function(newValue){
    	if(!_.isUndefined(newValue) && (!_.isUndefined(newValue.Vendor_Id)) && newValue.Vendor_Id ){
    		self.selectedVendor(ko.toJS(newValue));
    	}
    });
        
    self.selectedVendor.subscribe(function(newValue) {
    	self.clearMsg();
    	
    	self.hideAll();
    	
    	if(!_.isUndefined(newValue) && (!_.isUndefined(newValue.Vendor_Id)) && newValue.Vendor_Id ){
    		self.loadOffers();
    		self.canCreateOffer(true);
    	} else {
        	self.offers.removeAll();
    		self.canCreateOffer(false);
    	}
    });
    
    self.vendors.subscribe(function(newValue) {
    	//self.clearMsg();
    	self.hideAll();
    	
    	var count = newValue.length;
    	if(count === 0)
    		showMsg("Vendors not found.", true);
    	else {
    		//showMsg(count + " Vendor(s) found.", true);
    	}
    });
    
    self.offers.subscribe(function(newValue) {
    	var count = newValue.length;
    	
    	if(!_.isUndefined(self.selectedVendor()) && !_.isUndefined(self.selectedVendor().Vendor_Name)){
	    	if(count === 0)
	    		showMsg(self.selectedVendor().Vendor_Name + " : No offers.", true);
    	}
    });
    
    self.offerUpdating.subscribe(function(newValue) {
    	if(newValue && self.selectedOffer() && self.selectedOffer().Offer_Type && (self.selectedOffer().Offer_Type === 'special')){
        	if(self.canCreateSpecialOffer()){
        		//console.log("Editing Special Offer....");
        		self.specialOfferUpdating(true);
        	} else {
        		self.specialOfferUpdating(false);
        	}
    	} else {
    		//console.log("Editing NON-Special Offer....");
    		self.specialOfferUpdating(false);
    	}
    });
    
    self.specialOfferUpdating.subscribe(function(newValue){
    	//console.log("Special Offer: " + newValue);
    	if(newValue) {
    		//$("#offerImagePreviewContainer").width(self.OFFER_SPECIAL_IMAGE_WIDTH);
    		//$("#offerImagePreviewContainer").width(480);
    		$("#offerImagePreviewContainer").css("width","480px");
    		//console.log("Width: " + $("#offerImagePreviewContainer").width());
    	} else { 
    		//console.log("Non Special");
    		//$("#offerImagePreviewContainer").width(self.OFFER_IMAGE_WIDTH);
    		//$("#offerImagePreviewContainer").width(200);
    		$("#offerImagePreviewContainer").css("width","200px");
    		//console.log("Width: " + $("#offerImagePreviewContainer").width());
    	}
    });
    
    self.displayOffer = function(offer){
    	self.selectedOffer(offer);
    	self.updateDisplay("offerDisplaying", true);
    }
    
    self.clearMsg = function(){
    	$("#alertbox").html("");
    }
    
    self.updateDisplay = function(type, value){
    	self.clearMsg();
    	self[type](value);
    	
    	var states = ["offerUpdating", "vendorUpdating", "offerDisplaying", "vendorDisplaying"];
    	states.splice(states.indexOf(type), 1);
    	
    	_.each(states, function(s){
    		self[s](!value);
    	});
    }
    
    self.creatingVendor = function(){
    	self.dummyVendor(undefined);
    	self.selectedVendor({});
    	self.updateDisplay("vendorUpdating", true);
    }
    
    self.creatingOffer = function(){
    	self.selectedOffer({});
    	
    	self.updateDisplay("offerUpdating", true);
    }
    
    self.creatingSpecialOffer = function(){
    	if(self.canCreateSpecialOffer()){
    		self.specialOfferUpdating(true);
    	}
    	
    	self.creatingOffer();
    }
    
    self.isUUID = function(uuid){
    	//return uuid.match(/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/);
    	return (/[a-f0-9]{24}/).test(uuid);
    }
    
    self.editingVendor = function(){
    	self.updateDisplay("vendorUpdating", true);
    }
    
    self.editingOffer = function(){
    	self.updateDisplay("offerUpdating", true);
    }
    
    self.hideVendor = function(){
    	if((!_.isUndefined(self.selectedVendor().Vendor_Id)) && (self.isUUID(self.selectedVendor().Vendor_Id))) {
        	self.vendorUpdating(false);
        	self.vendorDisplaying(true);
    	} else {
    		self.hideAll();
    	}

    }
    
    self.hideOffer = function(){
    	if((!_.isUndefined(self.selectedOffer().Id)) && (self.isUUID(self.selectedOffer().Id))) {
    		self.specialOfferUpdating(false);
        	self.offerUpdating(false);
        	self.offerDisplaying(true);
    	} else {
    		self.hideAll();
    	}

    }

    self.hideAll = function(){
    	self.specialOfferUpdating(false);
    	
    	self.vendorUpdating(false);
    	self.offerUpdating(false);
    	self.vendorDisplaying(false);
    	self.offerDisplaying(false);
    }    
    
	self.loadData = function(){
		self.canCreateSpecialOffer(true);
		
		$.getJSON(OFFER_API_URL + "offer/category", function(categories){
			self.availableCategories(_.pluck(categories,'title'));
			self.loadVendors();
		});
		
		self.loadVendors();
	}
    	
    self.loadData();
}

function vendorLogoChange(obj){
	oVM.clearMsg();
	
    var file = obj.files[0];
    
    if(!_.isUndefined(file)){
        var name = file.name;
        var size = file.size;
        var type = file.type;
        
        if((type.match(/image.*/)) && size > 0 && size <= oVM.MAX_SIZE) {
            var oFReader = new FileReader();
            oFReader.readAsDataURL(file);
            oFReader.onload = function (oFREvent) {
    	        var image = new Image();
    	        image.src = oFREvent.target.result;
    	        image.onload = function(){
    	        	console.log("Size: " + this.width + "x" + this.height);
    				if((this.height === oVM.VENDOR_IMAGE_HEIGHT) && (this.width === oVM.VENDOR_IMAGE_WIDTH)){
    					document.getElementById("vendorLogoPreview").src = oFREvent.target.result;
    					return true;
    				} else {
    					var control = $("#Vendor_Logo");
    					control.replaceWith( control = control.clone( true ) );
    					document.getElementById("vendorLogoPreview").src = "data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACwAAAAAAQABAAACAkQBADs=";
    					
    					showMsg("Invalid Vendor Logo. Must be " + oVM.VENDOR_IMAGE_WIDTH + "x" + oVM.VENDOR_IMAGE_HEIGHT + " pixels.", false);
    					return false;
    				}
    	        };
            };
        } else {
    		var control = $("#Vendor_Logo");
    		control.replaceWith( control = control.clone( true ) );
    		document.getElementById("vendorLogoPreview").src = "data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACwAAAAAAQABAAACAkQBADs=";
    		
    		showMsg("Invalid Vendor Logo. Must be " + oVM.VENDOR_IMAGE_WIDTH + "x" + oVM.VENDOR_IMAGE_HEIGHT + " pixels.", false);
    		return false;
        }
    } else {
		var control = $("#Vendor_Logo");
		control.replaceWith( control = control.clone( true ) );
		document.getElementById("vendorLogoPreview").src = "data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACwAAAAAAQABAAACAkQBADs=";
		
		showMsg("Invalid Vendor Logo. Must be " + oVM.VENDOR_IMAGE_WIDTH + "x" + oVM.VENDOR_IMAGE_HEIGHT + " pixels.", false);
		return false;
    }
    	
}

function offerImageChange(obj){
	oVM.clearMsg();
	
    var file = obj.files[0];
    
    if(!_.isUndefined(file)){
        var name = file.name;
        var size = file.size;
        var type = file.type;
        
        if((type.match(/image.*/)) && size > 0 && size <= oVM.MAX_SIZE) {
            var oFReader = new FileReader();
            oFReader.readAsDataURL(file);
            oFReader.onload = function (oFREvent) {
    	        var image = new Image();
    	        image.src = oFREvent.target.result;
    	        image.onload = function(){
    	        	console.log("Size: " + this.width + "x" + this.height);
    				if((!(oVM.specialOfferUpdating())) && (this.height === oVM.OFFER_IMAGE_HEIGHT) && (this.width === oVM.OFFER_IMAGE_WIDTH)){
    					document.getElementById("offerImagePreview").src = oFREvent.target.result;
    					return true;
    				} else if(oVM.specialOfferUpdating() && (this.height === oVM.OFFER_IMAGE_HEIGHT) && (this.width === oVM.OFFER_SPECIAL_IMAGE_WIDTH)){
    					document.getElementById("offerImagePreview").src = oFREvent.target.result;
    					return true;
    				} else {
    					var control = $("#Offer_Image");
    					control.replaceWith( control = control.clone( true ) );
    					document.getElementById("offerImagePreview").src = "data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACwAAAAAAQABAAACAkQBADs=";
    					
    					if(oVM.specialOfferUpdating()){
    						showMsg("Invalid Special Offer Image. Must be " + oVM.OFFER_SPECIAL_IMAGE_WIDTH + "x" + oVM.OFFER_IMAGE_HEIGHT + " pixesl.", false);
    					} else {
    						showMsg("Invalid Offer Image. Must be " + oVM.OFFER_IMAGE_WIDTH + "x" + oVM.OFFER_IMAGE_HEIGHT + " pixesl.", false);
    					}
    					
    					return false;
    				}
    	        };
            };
        } else {
    		var control = $("#Offer_Image");
    		control.replaceWith( control = control.clone( true ) );
    		document.getElementById("offerImagePreview").src = "data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACwAAAAAAQABAAACAkQBADs=";
    		
    		showMsg("Invalid Offer Image. Must be " + oVM.OFFER_IMAGE_WIDTH + "x" + oVM.OFFER_IMAGE_HEIGHT + " pixesl.", false);
    		return false;        	
        }
    } else {
		var control = $("#Offer_Image");
		control.replaceWith( control = control.clone( true ) );
		document.getElementById("offerImagePreview").src = "data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACwAAAAAAQABAAACAkQBADs=";
		
		showMsg("Invalid Offer Image. Must be " + oVM.OFFER_IMAGE_WIDTH + "x" + oVM.OFFER_IMAGE_HEIGHT + " pixesl.", false);
		return false;
    }
}

$(document).ready(function(){
	init();
	$("#nav-offer").addClass("active");
	
});