var OrderPayment = function(Sequelize,sequelize){
    return sequelize.define('OrderPayment',{
    "id_order_payment": {
        "type": "INT(11)",
        "allowNull": false,
        "defaultValue": null,
        "primaryKey": true,
        "autoIncrement":true
    },
    "order_reference": {
        "type": "VARCHAR(9)",
        "allowNull": true,
        "defaultValue": null,
        "primaryKey": false,
        "unique": true
    },
    "id_currency": {
        "type": "INT(10) UNSIGNED",
        "allowNull": false,
        "defaultValue": null,
        "primaryKey": false
    },
    "amount": {
        "type": "DECIMAL(10,2)",
        "allowNull": false,
        "defaultValue": null,
        "primaryKey": false
    },
    "payment_method": {
        "type": "VARCHAR(255)",
        "allowNull": false,
        "defaultValue": null,
        "primaryKey": false
    },
    "conversion_rate": {
        "type": "DECIMAL(13,6)",
        "allowNull": false,
        "defaultValue": "1.000000",
        "primaryKey": false
    },
    "transaction_id": {
        "type": "VARCHAR(254)",
        "allowNull": true,
        "defaultValue": "",
        "primaryKey": false
    },
    "card_number": {
        "type": "VARCHAR(254)",
        "allowNull": true,
        "defaultValue": "",
        "primaryKey": false
    },
    "card_brand": {
        "type": "VARCHAR(254)",
        "allowNull": true,
        "defaultValue": "",
        "primaryKey": false
    },
    "card_expiration": {
        "type": "CHAR(7)",
        "allowNull": true,
        "defaultValue": "",
        "primaryKey": false
    },
    "card_holder": {
        "type": "VARCHAR(254)",
        "allowNull": true,
        "defaultValue": "",
        "primaryKey": false
    },
    "date_add": {
        "type": "DATETIME",
        "allowNull": false,
        "defaultValue": null,
        "primaryKey": false
    },
    "sy_is_verified": {
        "type": "TINYINT(3) UNSIGNED",
        "allowNull": true,
        "defaultValue": null,
        "primaryKey": false
    }
},{
        tableName:'ps_order_payment',
        timestamps:true,
        createdAt:'date_add',
        updatedAt:false,
        deletedAt:false,
        underscored:true,
        scopes:{
            admin:{
                attributes:['id_order_payment','order_reference','payment_method','amount','date_add','sy_is_verified']
            }
        }
    });

}

module.exports.OrderPaymentFunc = OrderPayment;
