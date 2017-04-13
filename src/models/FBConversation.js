module.exports.FBConversationFunc = function(Sequelize,sequelize){
    return sequelize.define('FBConversation',{
      "id": {
        "type": "INT(11)",
        "allowNull": false,
        "defaultValue": null,
        "primaryKey": true,
        autoIncrement:true
      },
      "pid": {
        "type": "BIGINT(20)",
        "allowNull": false,
        "defaultValue": null,
        "primaryKey": false
      },
      "uid": {
        "type": "BIGINT(20)",
        "allowNull": true,
        "defaultValue": null,
        "primaryKey": false
      },
      "t_mid": {
        "type": "VARCHAR(40)",
        "allowNull": true,
        "defaultValue": null,
        "primaryKey": false
      },
      "auid": {
        "type": "BIGINT(20)",
        "allowNull": true,
        "defaultValue": null,
        "primaryKey": false
      }
    },{
        tableName:'fb_conversation',
        timestamps:false,
        createdAt:false,
        updatedAt:false,
        deletedAt:false,
        underscored:true,
        scopes:{}
    });

}