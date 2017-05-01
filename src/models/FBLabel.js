module.exports.FBLabelFunc = function(Sequelize,sequelize){
    return sequelize.define('FBLabel',{
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
      "label_id": {
        "type": "BIGINT(20) UNSIGNED",
        "allowNull": false,
        "defaultValue": null,
        "primaryKey": true
      },
      "name": {
        "type": "VARCHAR(128)",
        "allowNull": false,
        "defaultValue": null,
        "primaryKey": false
      },
      "pid": {
        "type": "BIGINT(20) UNSIGNED",
        "allowNull": false,
        "defaultValue": null,
        "primaryKey": false
      }
    },{
        tableName:'fb_label',
        timestamps:false,
        createdAt:false,
        updatedAt:false,
        deletedAt:false,
        underscored:true,
        scopes:{}
    });

}