var OrderHistory = function(Sequelize,sequelize){
    return sequelize.define('OrderHistory',{
    "id_order_history": {
        "type": "INT(10) UNSIGNED",
        "allowNull": false,
        "defaultValue": null,
        "primaryKey": true
    },
    "id_employee": {
        "type": "INT(10) UNSIGNED",
        "allowNull": false,
        "defaultValue": null,
        "primaryKey": false
    },
    "id_order": {
        "type": "INT(10) UNSIGNED",
        "allowNull": false,
        "defaultValue": null,
        "primaryKey": false
    },
    "id_order_state": {
        "type": "INT(10) UNSIGNED",
        "allowNull": false,
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
        tableName:'ps_order_history',
        timestamps:true,
        createdAt:'date_add',
        updatedAt:false,
        deletedAt:false,
        underscored:true,
        scopes:{
            admin:{
                attributes:['id_order_history','id_employee','id_order','id_order_state','date_add']
            }
        }
    });

}

module.exports.OrderHistoryFunc = OrderHistory;
