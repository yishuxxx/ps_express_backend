module.exports.OrderInvoiceFunc = function(Sequelize,sequelize){
    return sequelize.define('OrderInvoice',
    {
        "id_order_invoice": {
            "type": "INT(11) UNSIGNED",
            "allowNull": false,
            "defaultValue": null,
            "primaryKey": true,
            "autoIncrement":true
        },
        "id_order": {
            "type": "INT(11)",
            "allowNull": false,
            "defaultValue": null,
            "primaryKey": false
        },
        "number": {
            "type": "INT(11)",
            "allowNull": false,
            "defaultValue": null,
            "primaryKey": false
        },
        "delivery_number": {
            "type": "INT(11)",
            "allowNull": false,
            "defaultValue": null,
            "primaryKey": false
        },
        "delivery_date": {
            "type": "DATETIME",
            "allowNull": true,
            "defaultValue": null,
            "primaryKey": false
        },
        "total_discount_tax_excl": {
            "type": "DECIMAL(20,6)",
            "allowNull": false,
            "defaultValue": "0.000000",
            "primaryKey": false
        },
        "total_discount_tax_incl": {
            "type": "DECIMAL(20,6)",
            "allowNull": false,
            "defaultValue": "0.000000",
            "primaryKey": false
        },
        "total_paid_tax_excl": {
            "type": "DECIMAL(20,6)",
            "allowNull": false,
            "defaultValue": "0.000000",
            "primaryKey": false
        },
        "total_paid_tax_incl": {
            "type": "DECIMAL(20,6)",
            "allowNull": false,
            "defaultValue": "0.000000",
            "primaryKey": false
        },
        "total_products": {
            "type": "DECIMAL(20,6)",
            "allowNull": false,
            "defaultValue": "0.000000",
            "primaryKey": false
        },
        "total_products_wt": {
            "type": "DECIMAL(20,6)",
            "allowNull": false,
            "defaultValue": "0.000000",
            "primaryKey": false
        },
        "total_shipping_tax_excl": {
            "type": "DECIMAL(20,6)",
            "allowNull": false,
            "defaultValue": "0.000000",
            "primaryKey": false
        },
        "total_shipping_tax_incl": {
            "type": "DECIMAL(20,6)",
            "allowNull": false,
            "defaultValue": "0.000000",
            "primaryKey": false
        },
        "shipping_tax_computation_method": {
            "type": "INT(10) UNSIGNED",
            "allowNull": true,
            "defaultValue": 0,
            "primaryKey": false
        },
        "total_wrapping_tax_excl": {
            "type": "DECIMAL(20,6)",
            "allowNull": false,
            "defaultValue": "0.000000",
            "primaryKey": false
        },
        "total_wrapping_tax_incl": {
            "type": "DECIMAL(20,6)",
            "allowNull": false,
            "defaultValue": "0.000000",
            "primaryKey": false
        },
        "shop_address": {
            "type": "TEXT",
            "allowNull": true,
            "defaultValue": null,
            "primaryKey": false
        },
        "invoice_address": {
            "type": "TEXT",
            "allowNull": true,
            "defaultValue": null,
            "primaryKey": false
        },
        "delivery_address": {
            "type": "TEXT",
            "allowNull": true,
            "defaultValue": null,
            "primaryKey": false
        },
        "note": {
            "type": "TEXT",
            "allowNull": true,
            "defaultValue": null,
            "primaryKey": false
        },
        "date_add": {
            "type": "DATETIME",
            "allowNull": false,
            "defaultValue": null,
            "primaryKey": false
        }
    },{
        tableName:'ps_order_invoice',
        timestamps:true,
        createdAt:'date_add',
        updatedAt:false,
        deletedAt:false,
        underscored:true,
        scopes:{
            admin:{
                attributes:['id_order_invoice','id_order','number','delivery_number']
            }
        }
    });

}