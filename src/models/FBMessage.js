module.exports.FBMessageFunc = function(Sequelize,sequelize){
    return sequelize.define('FBMessage',{
        "id": {
            "type": "INT(10) UNSIGNED",
            "allowNull": false,
            "defaultValue": null,
            "primaryKey": true,
            autoIncrement: true
        },
        "pid": {
            "type": "BIGINT(20) UNSIGNED",
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
        "pid_uid": {
            "type": "VARCHAR(40)",
            "allowNull": false,
            "defaultValue": null,
            "primaryKey": false
        },
        "t_mid": {
            "type": "VARCHAR(40)",
            "allowNull": true,
            "defaultValue": null,
            "primaryKey": false
        },
        "created_time": {
            "type": "TIMESTAMP",
            "allowNull": false,
            defaultValue: null,
            "primaryKey": false
        },
        "updated_time": {
            "type": "TIMESTAMP",
            "allowNull": false,
            defaultValue: null,
            "primaryKey": false
        },
        "mid": {
            "type": "VARCHAR(40)",
            "allowNull": false,
            "defaultValue": null,
            "primaryKey": false
        },
        "seq": {
            "type": "INT(11)",
            "allowNull": true,
            "defaultValue": null,
            "primaryKey": false
        },
        "text": {
            "type": "TEXT",
            "allowNull": false,
            "defaultValue": null,
            "primaryKey": false
        },
        "psid_recipient": {
            "type": "BIGINT(20) UNSIGNED",
            "allowNull": false,
            "defaultValue": null,
            "primaryKey": false
        },
        "psid_sender": {
            "type": "BIGINT(20) UNSIGNED",
            "allowNull": false,
            "defaultValue": null,
            "primaryKey": false
        },
        "timestamp": {
            "type": "BIGINT(20) UNSIGNED",
            "allowNull": false,
            "defaultValue": null,
            "primaryKey": false
        },
        "delivered_timestamp": {
            "type": "BIGINT(20)",
            "allowNull": true,
            "defaultValue": null,
            "primaryKey": false
        },
        "delivered": {
            "type": "TINYINT(4)",
            "allowNull": true,
            "defaultValue": null,
            "primaryKey": false
        },
        "read_timestamp": {
            "type": "BIGINT(20)",
            "allowNull": true,
            "defaultValue": null,
            "primaryKey": false
        }
    },{
        tableName:'fb_message',
        timestamps:true,
        createdAt:'created_time',
        updatedAt:'updated_time',
        deletedAt:false,
        underscored:true,
        scopes:{}
    });

}