module.exports.FBMessageFunc = function(Sequelize,sequelize){
    return sequelize.define('FBMessage',{
      "id": {
        "type": "INT(10) UNSIGNED",
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
      "m_mid": {
        "type": "VARCHAR(64)",
        "allowNull": false,
        "defaultValue": null,
        "primaryKey": true
      },
      "t_mid": {
        "type": "VARCHAR(64)",
        "allowNull": true,
        "defaultValue": null,
        "primaryKey": false
      },
      "attachment_id": {
        "type": "BIGINT(20) UNSIGNED",
        "allowNull": true,
        "defaultValue": null,
        "primaryKey": false
      },
      "created_time": {
        "type": "DATETIME",
        "allowNull": false,
        "defaultValue": null,
        "primaryKey": false
      },
      "uid_from": {
        "type": "BIGINT(20) UNSIGNED",
        "allowNull": true,
        "defaultValue": null,
        "primaryKey": false
      },
      "uid_to": {
        "type": "BIGINT(20) UNSIGNED",
        "allowNull": true,
        "defaultValue": null,
        "primaryKey": false
      },
      "message": {
        "type": "TEXT",
        "allowNull": false,
        "defaultValue": null,
        "primaryKey": false
      },
      "seq": {
        "type": "INT(11) UNSIGNED",
        "allowNull": true,
        "defaultValue": null,
        "primaryKey": false
      },
      "psid_sender": {
        "type": "BIGINT(20) UNSIGNED",
        "allowNull": true,
        "defaultValue": null,
        "primaryKey": false
      },
      "psid_recipient": {
        "type": "BIGINT(20) UNSIGNED",
        "allowNull": true,
        "defaultValue": null,
        "primaryKey": false
      },
      "timestamp": {
        "type": "BIGINT(20) UNSIGNED",
        "allowNull": true,
        "defaultValue": null,
        "primaryKey": false
      },
      "delivered_timestamp": {
        "type": "BIGINT(20) UNSIGNED",
        "allowNull": true,
        "defaultValue": null,
        "primaryKey": false
      },
      "delivered": {
        "type": "TINYINT(4) UNSIGNED",
        "allowNull": true,
        "defaultValue": null,
        "primaryKey": false
      },
      "read_timestamp": {
        "type": "BIGINT(20) UNSIGNED",
        "allowNull": true,
        "defaultValue": null,
        "primaryKey": false
      }
    },{
        tableName:'fb_message',
        timestamps:false,
        createdAt:false,
        updatedAt:false,
        deletedAt:false,
        underscored:true,
        scopes:{}
    });

}