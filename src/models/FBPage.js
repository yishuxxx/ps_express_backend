module.exports.FBPageFunc = function(Sequelize,sequelize){
    return sequelize.define('FBPage',{
      "id": {
        "type": "INT(11) UNSIGNED",
        "allowNull": false,
        "defaultValue": null,
        "primaryKey": false,
        autoIncrement: true
      },
      "created_at": {
        "type": "TIMESTAMP",
        allowNull: true,
        defaultValue: null,
        "primaryKey": false
      },
      "updated_at": {
        "type": "TIMESTAMP",
        allowNull: true,
        defaultValue: null,
        "primaryKey": false
      },
      "pid": {
        "type": "BIGINT(20) UNSIGNED",
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
      }
    },{
        tableName:'fb_page',
        timestamps:false,
        createdAt:false,
        updatedAt:false,
        deletedAt:false,
        underscored:true,
        scopes:{}
    });

}