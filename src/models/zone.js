module.exports.ZoneFunc = function(Sequelize,sequelize){
    return sequelize.define('Zone',{
        "id_zone": {
            "type": "INT(10) UNSIGNED",
            "allowNull": false,
            "defaultValue": null,
            "primaryKey": true
        },
        "name": {
            "type": "VARCHAR(64)",
            "allowNull": false,
            "defaultValue": null,
            "primaryKey": false
        },
        "active": {
            "type": "TINYINT(1) UNSIGNED",
            "allowNull": false,
            "defaultValue": "0",
            "primaryKey": false
        }
    },{
        tableName:'ps_zone',
        timestamps:true,
        createdAt:false,
        updatedAt:false,
        deletedAt:false,
        underscored:true,
        scopes:{
            admin:{
                attributes:['id_zone','name','active']
            }
        }
    });

}