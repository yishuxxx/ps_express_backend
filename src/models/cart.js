module.exports.CartFunc = function(Sequelize,sequelize){
    return sequelize.define('Cart',{
        "id_cart": {
            "type": "INT(10) UNSIGNED",
            "allowNull": false,
            "defaultValue": null,
            "primaryKey": true
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
        "id_carrier": {
            "type": "INT(10) UNSIGNED",
            "allowNull": false,
            "defaultValue": null,
            "primaryKey": false
        },
        "delivery_option": {
            "type": "TEXT",
            "allowNull": false,
            "defaultValue": null,
            "primaryKey": false
        },
        "id_lang": {
            "type": "INT(10) UNSIGNED",
            "allowNull": false,
            "defaultValue": null,
            "primaryKey": false
        },
        "id_address_delivery": {
            "type": "INT(10) UNSIGNED",
            "allowNull": false,
            "defaultValue": null,
            "primaryKey": false
        },
        "id_address_invoice": {
            "type": "INT(10) UNSIGNED",
            "allowNull": false,
            "defaultValue": null,
            "primaryKey": false
        },
        "id_currency": {
            "type": "INT(10) UNSIGNED",
            "allowNull": false,
            "defaultValue": null,
            "primaryKey": false
        },
        "id_customer": {
            "type": "INT(10) UNSIGNED",
            "allowNull": false,
            "defaultValue": null,
            "primaryKey": false
        },
        "id_guest": {
            "type": "INT(10) UNSIGNED",
            "allowNull": false,
            "defaultValue": null,
            "primaryKey": false
        },
        "secure_key": {
            "type": "VARCHAR(32)",
            "allowNull": false,
            "defaultValue": "-1",
            "primaryKey": false
        },
        "recyclable": {
            "type": "TINYINT(1) UNSIGNED",
            "allowNull": false,
            "defaultValue": "1",
            "primaryKey": false
        },
        "gift": {
            "type": "TINYINT(1) UNSIGNED",
            "allowNull": false,
            "defaultValue": "0",
            "primaryKey": false
        },
        "gift_message": {
            "type": "TEXT",
            "allowNull": true,
            "defaultValue": null,
            "primaryKey": false
        },
        "mobile_theme": {
            "type": "TINYINT(1)",
            "allowNull": false,
            "defaultValue": "0",
            "primaryKey": false
        },
        "allow_seperated_package": {
            "type": "TINYINT(1) UNSIGNED",
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
        tableName:'ps_cart',
        timestamps:true,
        createdAt:'date_add',
        updatedAt:'date_upd',
        deletedAt:false,
        underscored:true,
        scopes:{
            admin:{
                attributes:['id_cart','id_carrier','id_address_delivery','id_address_invoice',
                'id_customer','id_guest','date_add','date_upd']
            }
        }
    });

}