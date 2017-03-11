module.exports.GroupFunc = function(Sequelize,sequelize){
    return sequelize.define('Group',{
        "id_group": {
            "type": "INT(10) UNSIGNED",
            "allowNull": false,
            "defaultValue": null,
            "primaryKey": true
        },
        "reduction": {
            "type": "DECIMAL(17,2)",
            "allowNull": false,
            "defaultValue": "0.00",
            "primaryKey": false
        },
        "price_display_method": {
            "type": "TINYINT(4)",
            "allowNull": false,
            "defaultValue": "0",
            "primaryKey": false
        },
        "show_prices": {
            "type": "TINYINT(1) UNSIGNED",
            "allowNull": false,
            "defaultValue": "1",
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
        tableName:'ps_group',
        timestamps:true,
        createdAt:'date_add',
        updatedAt:'date_upd',
        deletedAt:false,
        underscored:true,
        scopes:{
            admin:{
                attributes:['id_group','date_add','date_upd']
            }
        }
    });

}