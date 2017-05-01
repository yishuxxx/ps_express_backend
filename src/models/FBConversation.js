module.exports.FBConversationFunc = function(Sequelize,sequelize){
    return sequelize.define('FBConversation',{
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
      "t_mid": {
        "type": "VARCHAR(64)",
        "allowNull": false,
        "defaultValue": null,
        "primaryKey": true
      },
      "pid": {
        "type": "BIGINT(20) UNSIGNED",
        "allowNull": false,
        "defaultValue": null,
        "primaryKey": false
      },
      "uid": {
        "type": "BIGINT(20) UNSIGNED",
        "allowNull": true,
        "defaultValue": null,
        "primaryKey": false
      },
      "pid_uid": {
        "type": "VARCHAR(64)",
        "allowNull": false,
        "defaultValue": null,
        "primaryKey": false
      },
      "psid": {
        "type": "BIGINT(20) UNSIGNED",
        "allowNull": true,
        "defaultValue": null,
        "primaryKey": false
      },
      "link": {
        "type": "VARCHAR(128)",
        "allowNull": false,
        "defaultValue": null,
        "primaryKey": false
      },
      "updated_time": {
        "type": "DATETIME",
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
      "snippet": {
        "type": "TEXT",
        "allowNull": true,
        "defaultValue": null,
        "primaryKey": false
      },
      "unread_count": {
        "type": "INT(11) UNSIGNED",
        "allowNull": true,
        "defaultValue": null,
        "primaryKey": false
      },
      "message_count": {
        "type": "INT(11) UNSIGNED",
        "allowNull": false,
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
        scopes:{},
        getterMethods: {
          messages: function() {
            if(this.FBMessages && this.FBMessages.length >= 1){
              return {data:this.FBMessages};
            }
            return null;
          }
        }
    });

}