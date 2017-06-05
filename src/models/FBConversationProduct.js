module.exports.FBConversationProductFunc = function(Sequelize,sequelize){
    return sequelize.define('FBConversationProduct',{
      "t_mid_id_product": {
        "type": "VARCHAR(64)",
        "allowNull": false,
        "defaultValue": null,
        "primaryKey": true
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
        "primaryKey": false
      },
      "id_product": {
        "type": "INT(10) UNSIGNED",
        "allowNull": false,
        "defaultValue": null,
        "primaryKey": false
      },
      "id_employee": {
        "type": "INT(10) UNSIGNED",
        "allowNull": true,
        "defaultValue": null,
        "primaryKey": false
      },
      "comment_id": {
        "type": "VARCHAR(64)",
        "allowNull": true,
        "defaultValue": null,
        "primaryKey": false
      },
      "post_id": {
        "type": "VARCHAR(64)",
        "allowNull": true,
        "defaultValue": null,
        "primaryKey": false
      }
    },{
        tableName:'fb_conversation_product',
        timestamps:false,
        createdAt:false,
        updatedAt:false,
        deletedAt:false,
        underscored:true,
        scopes:{}
    });

}