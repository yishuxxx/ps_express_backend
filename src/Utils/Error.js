/*
module.exports.FBGraphAPIError = function FBGraphAPIError(msg) {
    var err = Error.call(this, msg);
    err.name = "FBGraphAPIError";
    return err;
}

module.exports.FBGraphAPIStandardError = function FBGraphAPIStandardError(msg) {
    var err = Error.call(this, msg);
    err.name = "FBGraphAPIStandardError";
    return err;
}
*/

class FBGraphAPIError extends Error {
	constructor(msg){
		let err = super(msg);
	    err.name = "FBGraphAPIError";
	    return err;
	}
}
module.exports.FBGraphAPIError = FBGraphAPIError;

class FBGraphAPIStandardError extends Error {
	constructor(msg){
		let err = super(msg);
	    err.name = "FBGraphAPIStandardError";
	    return err;
	}
}
module.exports.FBGraphAPIStandardError = FBGraphAPIStandardError;

class FBGraphAPINoResultError extends Error {
	constructor(msg){
		let err = super(msg);
	    err.name = "FBGraphAPINoResultError";
	    return err;
	}
}
module.exports.FBGraphAPINoResultError = FBGraphAPINoResultError

class SequelizeError extends Error {
	constructor(msg){
		let err = super(msg);
	    err.name = "SequelizeError";
	    return err;
	}
}
module.exports.SequelizeError = SequelizeError;

class SequelizeNoResultError extends Error {
	constructor(msg){
		let err = super(msg);
	    err.name = "SequelizeNoResultError";
	    return err;
	}
}
module.exports.SequelizeNoResultError = SequelizeNoResultError;

class RequestQueryParametersInvalidError extends Error {
	constructor(msg){
		let err = super(msg);
	    err.name = "RequestQueryParametersInvalidError";
	    return err;
	}
}
module.exports.RequestQueryParametersInvalidError = RequestQueryParametersInvalidError;