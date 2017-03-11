module.exports.SYOrderFunc = function(Sequelize,sequelize){

    return sequelize.define('SYOrder',{
        "id_syorder":{
            "type": "INT(10) UNSIGNED",
            "allowNull": false,
            "defaultValue": null,
            "primaryKey": true,
            "autoIncrement":true
        },
        "id_order": {
            "type": "INT(10) UNSIGNED",
            "allowNull": false,
            "defaultValue": null,
            "primaryKey": false
        },
        "order_no": {
            "type": "VARCHAR(10)",
            "allowNull": true,
            "defaultValue": null,
            "primaryKey": false
        },
        "id_sypage": {
            "type": "INT(10) UNSIGNED",
            "allowNull": true,
            "defaultValue": null,
            "primaryKey": false
        },
        "note": {
            "type": "TEXT",
            "allowNull": true,
            "defaultValue": null,
            "primaryKey": false
        }
    },{
        tableName:'sy_order',
        timestamps:false,
        createdAt:false,
        updatedAt:false,
        deletedAt:false,
        underscored:true,
        scopes:{
            admin:{
                attributes:['id_syorder','id_order','order_no','id_sypage','note']
            }
        }
    });

};