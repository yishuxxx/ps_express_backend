var OrderCarrier = function(Sequelize,sequelize){
    return sequelize.define('OrderCarrier',{
        "id_order_carrier": {
            "type": "INT(11)",
            "allowNull": false,
            "defaultValue": null,
            "primaryKey": true,
            "autoIncrement":true
        },
        "id_order": {
            "type": "INT(11) UNSIGNED",
            "allowNull": false,
            "defaultValue": null,
            "primaryKey": false
        },
        "id_carrier": {
            "type": "INT(11) UNSIGNED",
            "allowNull": false,
            "defaultValue": null,
            "primaryKey": false
        },
        "id_order_invoice": {
            "type": "INT(11) UNSIGNED",
            "allowNull": true,
            "defaultValue": null,
            "primaryKey": false
        },
        "weight": {
            "type": "DECIMAL(20,6)",
            "allowNull": true,
            "defaultValue": null,
            "primaryKey": false
        },
        "shipping_cost_tax_excl": {
            "type": "DECIMAL(20,6)",
            "allowNull": true,
            "defaultValue": null,
            "primaryKey": false
        },
        "shipping_cost_tax_incl": {
            "type": "DECIMAL(20,6)",
            "allowNull": true,
            "defaultValue": null,
            "primaryKey": false
        },
        "tracking_number": {
            "type": "VARCHAR(64)",
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
        tableName:'ps_order_carrier',
        timestamps:true,
        createdAt:'date_add',
        updatedAt:false,
        deletedAt:false,
        underscored:true,
        scopes:{
            admin:{
                attributes:[
                    'id_order_carrier',
                    'id_order',
                    'id_carrier',
                    'id_order_invoice',
                    'weight',
                    'shipping_cost_tax_excl',
                    'shipping_cost_tax_incl',
                    'tracking_number',
                    'date_add'
                ]
            }
        }
    });

}

module.exports.OrderCarrierFunc = OrderCarrier;
