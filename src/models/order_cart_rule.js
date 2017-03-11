module.exports.OrderCartRuleFunc = function(Sequelize,sequelize){
    return sequelize.define('OrderCartRule',{
        "id_order_cart_rule": {
            "type": "INT(10) UNSIGNED",
            "allowNull": false,
            "defaultValue": null,
            "primaryKey": true,
            "autoIncrement": true
        },
        "id_order": {
            "type": "INT(10) UNSIGNED",
            "allowNull": false,
            "defaultValue": null,
            "primaryKey": false
        },
        "id_cart_rule": {
            "type": "INT(10) UNSIGNED",
            "allowNull": false,
            "defaultValue": null,
            "primaryKey": false
        },
        "id_order_invoice": {
            "type": "INT(10) UNSIGNED",
            "allowNull": true,
            "defaultValue": "0",
            "primaryKey": false
        },
        "name": {
            "type": "VARCHAR(254)",
            "allowNull": false,
            "defaultValue": null,
            "primaryKey": false
        },
        "value": {
            "type": "DECIMAL(17,2)",
            "allowNull": false,
            "defaultValue": "0.00",
            "primaryKey": false
        },
        "value_tax_excl": {
            "type": "DECIMAL(17,2)",
            "allowNull": false,
            "defaultValue": "0.00",
            "primaryKey": false
        },
        "free_shipping": {
            "type": "TINYINT(1)",
            "allowNull": false,
            "defaultValue": "0",
            "primaryKey": false
        }
    },{
        tableName:'ps_order_cart_rule',
        timestamps:false,
        createdAt:false,
        updatedAt:false,
        deletedAt:false,
        underscored:true,
        scopes:{
            admin:{
                attributes:[
                    'id_order_cart_rule',
                    'id_order',
                    'id_cart_rule',
                    'id_order_invoice',
                    'name',
                    'value',
                    'value_tax_excl',
                    'free_shipping'
                ]
            }
        }
    });

}