module.exports.CartRuleFunc = function(Sequelize,sequelize){
    return sequelize.define('CartRule',{
        "id_cart_rule": {
            "type": "INT(10) UNSIGNED",
            "allowNull": false,
            "defaultValue": null,
            "primaryKey": true
        },
        "id_customer": {
            "type": "INT(10) UNSIGNED",
            "allowNull": false,
            "defaultValue": "0",
            "primaryKey": false
        },
        "date_from": {
            "type": "DATETIME",
            "allowNull": false,
            "defaultValue": null,
            "primaryKey": false
        },
        "date_to": {
            "type": "DATETIME",
            "allowNull": false,
            "defaultValue": null,
            "primaryKey": false
        },
        "description": {
            "type": "TEXT",
            "allowNull": true,
            "defaultValue": null,
            "primaryKey": false
        },
        "quantity": {
            "type": "INT(10) UNSIGNED",
            "allowNull": false,
            "defaultValue": "0",
            "primaryKey": false
        },
        "quantity_per_user": {
            "type": "INT(10) UNSIGNED",
            "allowNull": false,
            "defaultValue": "0",
            "primaryKey": false
        },
        "priority": {
            "type": "INT(10) UNSIGNED",
            "allowNull": false,
            "defaultValue": "1",
            "primaryKey": false
        },
        "partial_use": {
            "type": "TINYINT(1) UNSIGNED",
            "allowNull": false,
            "defaultValue": "0",
            "primaryKey": false
        },
        "code": {
            "type": "VARCHAR(254)",
            "allowNull": false,
            "defaultValue": null,
            "primaryKey": false
        },
        "minimum_amount": {
            "type": "DECIMAL(17,2)",
            "allowNull": false,
            "defaultValue": "0.00",
            "primaryKey": false
        },
        "minimum_amount_tax": {
            "type": "TINYINT(1)",
            "allowNull": false,
            "defaultValue": "0",
            "primaryKey": false
        },
        "minimum_amount_currency": {
            "type": "INT(10) UNSIGNED",
            "allowNull": false,
            "defaultValue": "0",
            "primaryKey": false
        },
        "minimum_amount_shipping": {
            "type": "TINYINT(1)",
            "allowNull": false,
            "defaultValue": "0",
            "primaryKey": false
        },
        "country_restriction": {
            "type": "TINYINT(1) UNSIGNED",
            "allowNull": false,
            "defaultValue": "0",
            "primaryKey": false
        },
        "carrier_restriction": {
            "type": "TINYINT(1) UNSIGNED",
            "allowNull": false,
            "defaultValue": "0",
            "primaryKey": false
        },
        "group_restriction": {
            "type": "TINYINT(1) UNSIGNED",
            "allowNull": false,
            "defaultValue": "0",
            "primaryKey": false
        },
        "cart_rule_restriction": {
            "type": "TINYINT(1) UNSIGNED",
            "allowNull": false,
            "defaultValue": "0",
            "primaryKey": false
        },
        "product_restriction": {
            "type": "TINYINT(1) UNSIGNED",
            "allowNull": false,
            "defaultValue": "0",
            "primaryKey": false
        },
        "shop_restriction": {
            "type": "TINYINT(1) UNSIGNED",
            "allowNull": false,
            "defaultValue": "0",
            "primaryKey": false
        },
        "free_shipping": {
            "type": "TINYINT(1)",
            "allowNull": false,
            "defaultValue": "0",
            "primaryKey": false
        },
        "reduction_percent": {
            "type": "DECIMAL(5,2)",
            "allowNull": false,
            "defaultValue": "0.00",
            "primaryKey": false
        },
        "reduction_amount": {
            "type": "DECIMAL(17,2)",
            "allowNull": false,
            "defaultValue": "0.00",
            "primaryKey": false
        },
        "reduction_tax": {
            "type": "TINYINT(1) UNSIGNED",
            "allowNull": false,
            "defaultValue": "0",
            "primaryKey": false
        },
        "reduction_currency": {
            "type": "INT(10) UNSIGNED",
            "allowNull": false,
            "defaultValue": "0",
            "primaryKey": false
        },
        "reduction_product": {
            "type": "INT(10)",
            "allowNull": false,
            "defaultValue": "0",
            "primaryKey": false
        },
        "gift_product": {
            "type": "INT(10) UNSIGNED",
            "allowNull": false,
            "defaultValue": "0",
            "primaryKey": false
        },
        "gift_product_attribute": {
            "type": "INT(10) UNSIGNED",
            "allowNull": false,
            "defaultValue": "0",
            "primaryKey": false
        },
        "highlight": {
            "type": "TINYINT(1) UNSIGNED",
            "allowNull": false,
            "defaultValue": "0",
            "primaryKey": false
        },
        "active": {
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
        tableName:'ps_cart_rule',
        timestamps:true,
        createdAt:'date_add',
        updatedAt:'date_upd',
        deletedAt:false,
        underscored:true,
        scopes:{
            admin:{
                attributes:[
                'id_cart_rule',
                'id_customer',
                'date_from',
                'date_to',
                'description',
                'code',
                'free_shipping',
                'group_restriction',
                'reduction_amount',
                'reduction_tax',
                'gift_product',
                'gift_product_attribute',
                'active',
                'date_add',
                'date_upd']
            }
        }
    });

}