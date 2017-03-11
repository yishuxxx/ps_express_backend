module.exports.SpecificPriceFunc = function(Sequelize,sequelize){
    return sequelize.define('SpecificPrice',{
        "id_specific_price": {
            "type": "INT(10) UNSIGNED",
            "allowNull": false,
            "defaultValue": null,
            "primaryKey": true
        },
        "id_specific_price_rule": {
            "type": "INT(11) UNSIGNED",
            "allowNull": false,
            "defaultValue": null,
            "primaryKey": false
        },
        "id_cart": {
            "type": "INT(11) UNSIGNED",
            "allowNull": false,
            "defaultValue": null,
            "primaryKey": false
        },
        "id_product": {
            "type": "INT(10) UNSIGNED",
            "allowNull": false,
            "defaultValue": null,
            "primaryKey": false
        },
        "id_shop": {
            "type": "INT(11) UNSIGNED",
            "allowNull": false,
            "defaultValue": "1",
            "primaryKey": false
        },
        "id_shop_group": {
            "type": "INT(11) UNSIGNED",
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
        "id_country": {
            "type": "INT(10) UNSIGNED",
            "allowNull": false,
            "defaultValue": null,
            "primaryKey": false
        },
        "id_group": {
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
        "id_product_attribute": {
            "type": "INT(10) UNSIGNED",
            "allowNull": false,
            "defaultValue": null,
            "primaryKey": false
        },
        "price": {
            "type": "DECIMAL(20,6)",
            "allowNull": false,
            "defaultValue": null,
            "primaryKey": false
        },
        "from_quantity": {
            "type": "MEDIUMINT(8) UNSIGNED",
            "allowNull": false,
            "defaultValue": null,
            "primaryKey": false
        },
        "reduction": {
            "type": "DECIMAL(20,6)",
            "allowNull": false,
            "defaultValue": null,
            "primaryKey": false
        },
        "reduction_tax": {
            "type": "TINYINT(1)",
            "allowNull": false,
            "defaultValue": "1",
            "primaryKey": false
        },
        "reduction_type": {
            "type": "ENUM('amount','percentage')",
            "allowNull": false,
            "defaultValue": null,
            "primaryKey": false
        },
        "from": {
            "type": "DATETIME",
            "allowNull": false,
            "defaultValue": null,
            "primaryKey": false
        },
        "to": {
            "type": "DATETIME",
            "allowNull": false,
            "defaultValue": null,
            "primaryKey": false
        }
    },{
        tableName:'ps_specific_price',
        timestamps:false,
        createdAt:false,
        updatedAt:false,
        deletedAt:false,
        underscored:true,
        scopes:{
            admin:{
                attributes:['id_specific_price','id_specific_price_rule',
                'id_product','id_product_attribute','id_group','id_cart','id_country',
                'price','from_quantity','reduction','reduction_tax','reduction_type','from','to']
            }
        }
    });

}