exports.getFields = function(obj){
	fields = _.keys(obj.schema.paths);
	removeFields = ['_id', '__v'];
	return _.difference(fields,removeFields);
};

exports.getStringFields = function(obj){
	fields = _.keys(obj.schema.paths);
	removeFields = ['_id', '__v'];
	fields = _.difference(fields,removeFields);
	
	return _.filter(fields,function(f){ return obj.schema.paths[f].instance === 'String'; });
};

exports.getRequiredFields = function(obj){
	fields = _.keys(obj.schema.paths);
	removeFields = ['_id', '__v'];
	fields = _.difference(fields,removeFields);
	
	return _.filter(fields,function(f){ 
		if(obj.schema.paths && obj.schema.paths[f] && obj.schema.paths[f].validators && obj.schema.paths[f].validators[0]) 
			return obj.schema.paths[f].validators[0][2] === 'required';
		else 
			return false; 
	});	
};