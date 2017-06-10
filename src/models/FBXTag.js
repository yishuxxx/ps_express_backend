module.exports.FBXTagFunc = function(Sequelize,sequelize){
    return sequelize.define('FBXTag',{
      "tag_id": {
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
      "type": {
        "type": "CHAR(4)",
        "allowNull": true,
        "defaultValue": null,
        "primaryKey": false
      },
      "name": {
        "type": "VARCHAR(32)",
        "allowNull": false,
        "defaultValue": null,
        "primaryKey": false
      }
    },{
        tableName:'fbx_tag',
        timestamps:false,
        createdAt:false,
        updatedAt:false,
        deletedAt:false,
        underscored:true,
        scopes:{},
        getterMethods: {}
    });

}