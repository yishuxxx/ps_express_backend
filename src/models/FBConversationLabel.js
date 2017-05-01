module.exports.FBConversationLabelFunc = function(Sequelize,sequelize){
    return sequelize.define('FBConversationLabel',{
      "id": {
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
      "t_mid_label_id": {
        "type": "VARCHAR(64)",
        "allowNull": false,
        "defaultValue": null,
        "primaryKey": true
      },
      "label_id": {
        "type": "BIGINT(20) UNSIGNED",
        "allowNull": false,
        "defaultValue": null,
        "primaryKey": false
      },
      "t_mid": {
        "type": "VARCHAR(64)",
        "allowNull": false,
        "defaultValue": null,
        "primaryKey": false
      }
    },{
        tableName:'fb_conversation_label',
        timestamps:false,
        createdAt:false,
        updatedAt:false,
        deletedAt:false,
        underscored:true,
        scopes:{}
    });

}