var whoAmI = null;
var identity = null;

var OFFER_HOST = "localhost";
var OFFER_PORT = "8888";
var OFFER_API_URL = '/api/';

$(document).ready(function() {
	$.ajax({cache: false});
	var pages = ["offer"];
	
	$.ajaxSetup({ cache: true }); // enable cache
	
	/************ Section: Terminate Incomplete Ajax Requests ************/
	$.xhrPool = []; // array of uncompleted requests
	$.xhrPool.abortAll = function() { // our abort function
	    $(this).each(function(idx, jqXHR) {
	        jqXHR.abort();
	    });
	    $.xhrPool.length = 0;
	};

	$.ajaxSetup({
	    beforeSend: function(jqXHR) { // before jQuery send the request we will push it to our array
	        $.xhrPool.push(jqXHR);
	    },
	    complete: function(jqXHR) { // when some of the requests completed it will splice from the array
	        var index = $.xhrPool.indexOf(jqXHR);
	        if (index > -1) {
	            $.xhrPool.splice(index, 1);
	        }
	    }
	});
	/************ Section: Terminate Incomplete Ajax Requests ************/
	
});