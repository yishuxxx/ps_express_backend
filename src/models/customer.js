var Customer = function(Sequelize,sequelize,isUnique){

    return sequelize.define('Customer',{
        "id_customer": {
            "type": "INT(10) UNSIGNED",
            "allowNull": false,
            "defaultValue": null,
            "primaryKey": true,
            "autoIncrement":true
        },
        "id_shop_group": {
            "type": "INT(11) UNSIGNED",
            "allowNull": false,
            "defaultValue": "1",
            "primaryKey": false
        },
        "id_shop": {
            "type": "INT(11) UNSIGNED",
            "allowNull": false,
            "defaultValue": "1",
            "primaryKey": false
        },
        "id_gender": {
            "type": "INT(10) UNSIGNED",
            "allowNull": true,
            "defaultValue": 0,
            "primaryKey": false
        },
        "id_default_group": {
            "type": "INT(10) UNSIGNED",
            "allowNull": false,
            "defaultValue": 3,
            "primaryKey": false
        },
        "id_lang": {
            "type": "INT(10) UNSIGNED",
            "allowNull": true,
            "defaultValue": 1,
            "primaryKey": false
        },
        "id_risk": {
            "type": "INT(10) UNSIGNED",
            "allowNull": false,
            "defaultValue": 0,
            "primaryKey": false
        },
        "company": {
            "type": "VARCHAR(64)",
            "allowNull": true,
            "defaultValue": null,
            "primaryKey": false
        },
        "siret": {
            "type": "VARCHAR(14)",
            "allowNull": true,
            "defaultValue": null,
            "primaryKey": false
        },
        "ape": {
            "type": "VARCHAR(5)",
            "allowNull": true,
            "defaultValue": null,
            "primaryKey": false
        },
        "firstname": {
            "type": "VARCHAR(32)",
            "allowNull": false,
            "defaultValue": null,
            "primaryKey": false,
            "validate": {
                notEmpty: true,
                len: [1,40]
            }
        },
        "lastname": {
            "type": "VARCHAR(32)",
            "allowNull": false,
            "defaultValue": null,
            "primaryKey": false,
            "validate": {
                len: [0,40]
            }
        },
        "email": {
            "type": "VARCHAR(128)",
            "allowNull": false,
            "defaultValue": null,
            "primaryKey": false,
            "unique":true,
            "validate": {
                notEmpty: true,
                isEmail: true,
                isUnique: isUnique('customer','email')
            }
        },
        "passwd": {
            "type": "VARCHAR(32)",
            "allowNull": false,
            "defaultValue": null,
            "primaryKey": false
        },
        "last_passwd_gen": {
            "type": "TIMESTAMP",
            "allowNull": false,
            "defaultValue": "0000-00-00 00:00:00",
            "primaryKey": false
        },
        "birthday": {
            "type": "DATE",
            "allowNull": true,
            "defaultValue": "0000-00-00",
            "primaryKey": false
        },
        "newsletter": {
            "type": "TINYINT(1) UNSIGNED",
            "allowNull": false,
            "defaultValue": "0",
            "primaryKey": false
        },
        "ip_registration_newsletter": {
            "type": "VARCHAR(15)",
            "allowNull": true,
            "defaultValue": null,
            "primaryKey": false
        },
        "newsletter_date_add": {
            "type": "DATETIME",
            "allowNull": true,
            "defaultValue": "0000-00-00 00:00:00",
            "primaryKey": false
        },
        "optin": {
            "type": "TINYINT(1) UNSIGNED",
            "allowNull": false,
            "defaultValue": "0",
            "primaryKey": false
        },
        "website": {
            "type": "VARCHAR(128)",
            "allowNull": true,
            "defaultValue": null,
            "primaryKey": false
        },
        "outstanding_allow_amount": {
            "type": "DECIMAL(20,6)",
            "allowNull": false,
            "defaultValue": "0.000000",
            "primaryKey": false
        },
        "show_public_prices": {
            "type": "TINYINT(1) UNSIGNED",
            "allowNull": false,
            "defaultValue": "0",
            "primaryKey": false
        },
        "max_payment_days": {
            "type": "INT(10) UNSIGNED",
            "allowNull": false,
            "defaultValue": "60",
            "primaryKey": false
        },
        "secure_key": {
            "type": "VARCHAR(32)",
            "allowNull": false,
            "defaultValue": "-1",
            "primaryKey": false
        },
        "note": {
            "type": "TEXT",
            "allowNull": true,
            "defaultValue": null,
            "primaryKey": false
        },
        "active": {
            "type": "TINYINT(1) UNSIGNED",
            "allowNull": false,
            "defaultValue": "0",
            "primaryKey": false
        },
        "is_guest": {
            "type": "TINYINT(1)",
            "allowNull": false,
            "defaultValue": "0",
            "primaryKey": false
        },
        "deleted": {
            "type": "TINYINT(1)",
            "allowNull": false,
            "defaultValue": "0",
            "primaryKey": false
        },
        "date_add": {
            "type": "DATETIME",
            "allowNull": false,
            "defaultValue": null,
            "primaryKey": false
        },
        "date_upd": {
            "type": "DATETIME",
            "allowNull": false,
            "defaultValue": null,
            "primaryKey": false
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
                attributes:['id_customer','firstname','lastname','email','passwd','id_default_group','date_add','date_upd']
            }
        }
    });

}

module.exports.CustomerFunc = Customer;