module.exports.uniqueValidatorFunc = function(sequelize, modelName, field){
  return function(modelName, field){
    return function(value, next) {
    	sequelize.query(
    		`SELECT a.email FROM ps_customer as a WHERE a.email=:email`,
      	{ replacements: { email: value }, type: sequelize.QueryTypes.SELECT }).then(function(rows){
          if (rows.length !== 0) {
            next("email is already in use");
          } else {
            next();
          }
      	});
      };
  };
}