module.exports.FBAttachmentFunc = function(Sequelize,sequelize){
    return sequelize.define('FBAttachment',{
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
      "attachment_id": {
        "type": "BIGINT(20) UNSIGNED",
        "allowNull": false,
        "defaultValue": null,
        "primaryKey": true
      },
      "m_mid": {
        "type": "VARCHAR(64)",
        "allowNull": false,
        "defaultValue": null,
        "primaryKey": false
      },
      "mime_type": {
        "type": "VARCHAR(16)",
        "allowNull": true,
        "defaultValue": null,
        "primaryKey": false
      },
      "name": {
        "type": "VARCHAR(64)",
        "allowNull": true,
        "defaultValue": null,
        "primaryKey": false
      },
      "image_data": {
        "type": "TEXT",
        "allowNull": true,
        "defaultValue": null,
        "primaryKey": false
      },
      "file_url": {
        "type": "VARCHAR(128)",
        "allowNull": true,
        "defaultValue": null,
        "primaryKey": false
      },
      "size": {
        "type": "INT(11) UNSIGNED",
        "allowNull": true,
        "defaultValue": null,
        "primaryKey": false
      },
      "video_data": {
        "type": "TEXT",
        "allowNull": true,
        "defaultValue": null,
        "primaryKey": false
      }
    },{
        tableName:'fb_attachment',
        timestamps:false,
        createdAt:false,
        updatedAt:false,
        deletedAt:false,
        underscored:true,
        scopes:{}
    });

}