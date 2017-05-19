module.exports.FBMessageAttachmentFunc = function(Sequelize,sequelize){
    return sequelize.define('FBMessageAttachment',{
		"m_mid_attachment_id": {
			"type": "VARCHAR(128)",
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
		"attachment_id": {
			"type": "VARCHAR(64)",
			"allowNull": false,
			"defaultValue": null,
			"primaryKey": false
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
		}
	},{
        tableName:'fb_message_attachment',
        timestamps:false,
        createdAt:false,
        updatedAt:false,
        deletedAt:false,
        underscored:true,
        scopes:{},
        getterMethods: {}
    });
}