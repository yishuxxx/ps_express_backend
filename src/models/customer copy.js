var Customer = function(Sequelize,sequelize){
    return sequelize.define('Customer',{
        "id_customer": {
            "field": "id_customer",
            "type": Sequelize.INTEGER.UNSIGNED,
            "allowNull": false,
            "defaultValue": null,
            "autoIncrement": true,
            "primaryKey": true
        },
        "id_shop_group": {
            "field": "id_shop_group",
            "type": Sequelize.INTEGER.UNSIGNED,
            "allowNull": false,
            "key": "MUL",
            "defaultValue": 1,
        },
        "id_shop": {
            "field": "id_shop",
            "type": Sequelize.INTEGER.UNSIGNED,
            "allowNull": false,
            "key": "MUL",
            "defaultValue": 1,
        },
        "id_gender": {
            "field": "id_gender",
            "type": Sequelize.INTEGER.UNSIGNED,
            "allowNull": false,
            "key": "MUL",
            "defaultValue": 1,
            "extra": ""
        },
        "id_default_group": {
            "field": "id_default_group",
            "type": Sequelize.INTEGER.UNSIGNED,
            "allowNull": false,
            "defaultValue": 3,
        },
        "id_lang": {
            "field": "id_lang",
            "type": Sequelize.INTEGER.UNSIGNED,
            "allowNull": true,
            "defaultValue": 1,
        },
        "id_risk": {
            "field": "id_risk",
            "type": Sequelize.INTEGER.UNSIGNED,
            "allowNull": false,
            "defaultValue": 0,
        },
        "company": {
            "field": "company",
            "type": Sequelize.STRING(64),
            "allowNull": true,
            "defaultValue": null,
        },
        "siret": {
            "field": "siret",
            "type": Sequelize.STRING(14),
            "allowNull": true,
            "defaultValue": null,
        },
        "ape": {
            "field": "ape",
            "type": Sequelize.STRING(5),
            "allowNull": true,
            "defaultValue": null,
        },
        "firstname": {
            "field": "firstname",
            "type": Sequelize.STRING(32),
            "allowNull": false,
            "defaultValue": null,
        },
        "lastname": {
            "field": "lastname",
            "type": Sequelize.STRING(32),
            "allowNull": false,
            "defaultValue": null,
        },
        "email": {
            "field": "email",
            "type": Sequelize.STRING(128),
            "allowNull": false,
            "key": "MUL",
            "defaultValue": null,
            "unique":true,
            validate: {
                isUnique: function (value, next) {
                    var self = this;
                    Customer.findAll({where: {email: value}})
                        .then(function (user) {
                            //console.log('\x1b[32m','found customer with same email !!!!!!');
                            //console.log('\x1b[32m',user);
                            // reject if a different user wants to use the same email
                            //if (user && self.id !== user.id) {
                            //    return next('Email already in use!');
                            //}
                              if (user) {
                                return next('email' + ' "' + value + '" is already in use');
                              } else {
                                return next();
                              }

                            return next('Email already in use!');
                        })
                        .catch(function (err) {
                            console.log('\x1b[32m','caught some fucking error');
                            console.log('\x1b[32m',err);
                            return next();
                        });
                }
            }
        },
        "passwd": {
            "field": "passwd",
            "type": Sequelize.STRING(32),
            "allowNull": false,
            "defaultValue": null,
            "scopes":false
        },
        "last_passwd_gen": {
            "field": "last_passwd_gen",
            "type": Sequelize.DATE,
            "allowNull": false,
            "defaultValue": Sequelize.NOW,
        },
        "birthday": {
            "field": "birthday",
            "type": Sequelize.DATEONLY,
            "allowNull": true,
            "defaultValue": "0000-00-00",
        },
        "newsletter": {
            "field": "newsletter",
            "type": Sequelize.BOOLEAN,
            "allowNull": false,
            "defaultValue": 0,
        },
        "ip_registration_newsletter": {
            "field": "ip_registration_newsletter",
            "type": Sequelize.STRING(15),
            "allowNull": true,
            "defaultValue": null,
        },
        "newsletter_date_add": {
            "field": "newsletter_date_add",
            "type": Sequelize.DATE,
            "allowNull": true,
            "defaultValue": "0000-00-00 00:00:00",
        },
        "optin": {
            "field": "optin",
            "type": Sequelize.BOOLEAN,
            "allowNull": false,
            "defaultValue": 0,
        },
        "website": {
            "field": "website",
            "type": Sequelize.STRING(128),
            "allowNull": true,
            "defaultValue": null,
        },
        "outstanding_allow_amount": {
            "field": "outstanding_allow_amount",
            "type": Sequelize.DECIMAL(20,6),
            "allowNull": false,
            "defaultValue": 0.000000,
        },
        "show_public_prices": {
            "field": "show_public_prices",
            "type": Sequelize.BOOLEAN,
            "allowNull": false,
            "defaultValue": 0,
        },
        "max_payment_days": {
            "field": "max_payment_days",
            "type": Sequelize.INTEGER.UNSIGNED,
            "allowNull": false,
            "defaultValue": 0,
        },
        "secure_key": {
            "field": "secure_key",
            "type": Sequelize.STRING(32),
            "allowNull": false,
            "defaultValue": "-1",
        },
        "note": {
            "field": "note",
            "type": Sequelize.TEXT,
            "allowNull": true,
            "defaultValue": null,
        },
        "active": {
            "field": "active",
            "type": Sequelize.BOOLEAN,
            "allowNull": false,
            "defaultValue": 1,
        },
        "is_guest": {
            "field": "is_guest",
            "type": Sequelize.BOOLEAN,
            "allowNull": false,
            "defaultValue": 0,
        },
        "deleted": {
            "field": "deleted",
            "type": Sequelize.BOOLEAN,
            "allowNull": false,
            "defaultValue": 0,
        },
        "date_add": {
            "field": "date_add",
            "type": Sequelize.DATE,
            "allowNull": false,
            "defaultValue": null,
        },
        "date_upd": {
            "field": "date_upd",
            "type": Sequelize.DATE,
            "allowNull": false,
            "defaultValue": null,
        }
    },{
        tableName:'ps_customer',
        timestamps:true,
        createdAt:'date_add',
        updatedAt:'date_upd',
        deletedAt:false,
        underscored:true,
        scopes:{
            admin:{
                attributes:['firstname','lastname','email']
            }
        }
    });

}

var isUnique = function(modelName, field) {
  return function(value, next) {
    var Model = require("../models")[modelName];
    var query = {};
    query[field] = value;
    Model.find({where: query, attributes: ["id"]}).then(function(obj) {
      if (obj) {
        next(field + ' "' + value + '" is already in use');
      } else {
        next();
      }
    });
  };
}
module.exports.CustomerFunc = Customer;