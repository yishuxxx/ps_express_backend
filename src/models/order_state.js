var OrderState = function(Sequelize,sequelize){
    return sequelize.define('OrderState',{
    "id_order_state": {
        "type": "INT(10) UNSIGNED",
        "allowNull": false,
        "defaultValue": null,
        "primaryKey": true
    },
    "invoice": {
        "type": "TINYINT(1) UNSIGNED",
        "allowNull": true,
        "defaultValue": "0",
        "primaryKey": false
    },
    "send_email": {
        "type": "TINYINT(1) UNSIGNED",
        "allowNull": false,
        "defaultValue": "0",
        "primaryKey": false
    },
    "module_name": {
        "type": "VARCHAR(255)",
        "allowNull": true,
        "defaultValue": null,
        "primaryKey": false
    },
    "color": {
        "type": "VARCHAR(32)",
        "allowNull": true,
        "defaultValue": null,
        "primaryKey": false
    },
    "unremovable": {
        "type": "TINYINT(1) UNSIGNED",
        "allowNull": false,
        "defaultValue": null,
        "primaryKey": false
    },
    "hidden": {
        "type": "TINYINT(1) UNSIGNED",
        "allowNull": false,
        "defaultValue": "0",
        "primaryKey": false
    },
    "logable": {
        "type": "TINYINT(1)",
        "allowNull": false,
        "defaultValue": "0",
        "primaryKey": false
    },
    "delivery": {
        "type": "TINYINT(1) UNSIGNED",
        "allowNull": false,
        "defaultValue": "0",
        "primaryKey": false
    },
    "shipped": {
        "type": "TINYINT(1) UNSIGNED",
        "allowNull": false,
        "defaultValue": "0",
        "primaryKey": false
    },
    "paid": {
        "type": "TINYINT(1) UNSIGNED",
        "allowNull": false,
        "defaultValue": "0",
        "primaryKey": false
    },
    "pdf_invoice": {
        "type": "TINYINT(1) UNSIGNED",
        "allowNull": false,
        "defaultValue": "0",
        "primaryKey": false
    },
    "pdf_delivery": {
        "type": "TINYINT(1) UNSIGNED",
        "allowNull": false,
        "defaultValue": "0",
        "primaryKey": false
    },
    "deleted": {
        "type": "TINYINT(1) UNSIGNED",
        "allowNull": false,
        "defaultValue": "0",
        "primaryKey": false
    }
},{
        tableName:'ps_order_state',
        timestamps:false,
        createdAt:false,
        updatedAt:false,
        deletedAt:false,
        underscored:true,
        scopes:{
            admin:{
                attributes:['id_order_state','invoice','color']
            }
        }
    });

}

module.exports.OrderStateFunc = OrderState;
