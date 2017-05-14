module.exports.FBSReplyFunc = function(Sequelize,sequelize){
    return sequelize.define('FBSReply',{
        "sreply_id": {
          "type": "INT(10) UNSIGNED",
          "allowNull": false,
          "defaultValue": null,
          "primaryKey": true,
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
        "title": {
          "type": "VARCHAR(64)",
          "allowNull": false,
          "defaultValue": null,
          "primaryKey": false
        },
        "message": {
          "type": "TEXT",
          "allowNull": true,
          "defaultValue": null,
          "primaryKey": false
        },
        "upload_filename": {
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
        "id_employee": {
          "type": "INT(10) UNSIGNED",
          "allowNull": false,
          "defaultValue": null,
          "primaryKey": false
        }
      },{
        tableName:'fb_sreply',
        timestamps:false,
        createdAt:false,
        updatedAt:false,
        deletedAt:false,
        underscored:true,
        scopes:{},
        getterMethods: {}
    });

}