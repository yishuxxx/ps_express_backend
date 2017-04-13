module.exports.FBPageFunc = function(Sequelize,sequelize){
    return sequelize.define('FBPage',{
      "id": {
        "type": "INT(11)",
        "allowNull": false,
        "defaultValue": null,
        "primaryKey": true,
        autoIncrement: true
      },
      "pid": {
        "type": "VARCHAR(20)",
        "allowNull": false,
        "defaultValue": null,
        "primaryKey": false
      },
      "name": {
        "type": "VARCHAR(64)",
        "allowNull": false,
        "defaultValue": null,
        "primaryKey": false
      },
      "access_token": {
        "type": "VARCHAR(256)",
        "allowNull": true,
        "defaultValue": null,
        "primaryKey": false
      },
      "access_token_long": {
        "type": "VARCHAR(256)",
        "allowNull": true,
        "defaultValue": null,
        "primaryKey": false
      },
      "expires_in": {
        "type": "INT(11)",
        "allowNull": true,
        "defaultValue": null,
        "primaryKey": false
      },
      "created_time": {
        "type": "TIMESTAMP",
        "allowNull": false,
        "defaultValue": "CURRENT_TIMESTAMP",
        "primaryKey": false
      },
      "updated_time": {
        "type": "TIMESTAMP",
        "allowNull": false,
        "defaultValue": "0000-00-00 00:00:00",
        "primaryKey": false
      }
    },{
        tableName:'fb_page',
        timestamps:true,
        createdAt:'created_time',
        updatedAt:'updated_time',
        deletedAt:false,
        underscored:true,
        scopes:{}
    });

}