module.exports.FBUploadFunc = function(Sequelize,sequelize){
    return sequelize.define('FBUpload',{
        "upload_id": {
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
        "name": {
          "type": "VARCHAR(64)",
          "allowNull": false,
          "defaultValue": null,
          "primaryKey": false
        },
        "type": {
          "type": "VARCHAR(32)",
          "allowNull": false,
          "defaultValue": null,
          "primaryKey": false
        },
        "filename": {
          "type": "VARCHAR(32)",
          "allowNull": false,
          "defaultValue": null,
          "primaryKey": false
        },
        "created_by": {
          "type": "INT(11)",
          "allowNull": false,
          "defaultValue": null,
          "primaryKey": false
        },
        "pid": {
          "type": "BIGINT(20) UNSIGNED",
          "allowNull": true,
          "defaultValue": null,
          "primaryKey": false
        },
        "attachment_id": {
          "type": "VARCHAR(64)",
          "allowNull": true,
          "defaultValue": null,
          "primaryKey": false
        }
      },{
        tableName:'fb_upload',
        timestamps:false,
        createdAt:false,
        updatedAt:false,
        deletedAt:false,
        underscored:true,
        scopes:{},
        getterMethods: {
          filepath: function() {
            if(this.filename){
              return '/data/image/'+this.filename;
            }
            return null;
          }
        }
    });

}