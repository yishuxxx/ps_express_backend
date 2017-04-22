module.exports.FBCommentFunc = function(Sequelize,sequelize){
    return sequelize.define('FBComment',{
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
      "comment_id": {
        "type": "VARCHAR(64)",
        "allowNull": false,
        "defaultValue": null,
        "primaryKey": true
      },
      "post_id": {
        "type": "VARCHAR(64)",
        "allowNull": false,
        "defaultValue": null,
        "primaryKey": false
      },
      "uid": {
        "type": "BIGINT(20) UNSIGNED",
        "allowNull": false,
        "defaultValue": null,
        "primaryKey": false
      },
      "t_mid": {
        "type": "VARCHAR(64)",
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
      "message": {
        "type": "TEXT",
        "allowNull": false,
        "defaultValue": null,
        "primaryKey": false
      },
      "can_reply_privately": {
        "type": "TINYINT(4) UNSIGNED",
        "allowNull": false,
        "defaultValue": null,
        "primaryKey": false
      },
      "can_comment": {
        "type": "TINYINT(4) UNSIGNED",
        "allowNull": false,
        "defaultValue": null,
        "primaryKey": false
      },
      "can_hide": {
        "type": "TINYINT(4) UNSIGNED",
        "allowNull": false,
        "defaultValue": null,
        "primaryKey": false
      },
      "can_remove": {
        "type": "TINYINT(4) UNSIGNED",
        "allowNull": false,
        "defaultValue": null,
        "primaryKey": false
      },
      "comment_count": {
        "type": "INT(11) UNSIGNED",
        "allowNull": false,
        "defaultValue": null,
        "primaryKey": false
      }
    },{
        tableName:'fb_comment',
        timestamps:false,
        createdAt:false,
        updatedAt:false,
        deletedAt:false,
        underscored:true,
        scopes:{}
    });

}