module.exports.EmployeeFunc = function(Sequelize,sequelize){
    return sequelize.define('Employee',{
        "id_employee": {
            "type": "INT(10) UNSIGNED",
            "allowNull": false,
            "defaultValue": null,
            "primaryKey": true,
            "autoIncrement":true
        },
        "id_profile": {
            "type": "INT(10) UNSIGNED",
            "allowNull": false,
            "defaultValue": null,
            "primaryKey": false
        },
        "id_lang": {
            "type": "INT(10) UNSIGNED",
            "allowNull": false,
            "defaultValue": "0",
            "primaryKey": false
        },
        "lastname": {
            "type": "VARCHAR(32)",
            "allowNull": false,
            "defaultValue": null,
            "primaryKey": false
        },
        "firstname": {
            "type": "VARCHAR(32)",
            "allowNull": false,
            "defaultValue": null,
            "primaryKey": false
        },
        "email": {
            "type": "VARCHAR(128)",
            "allowNull": false,
            "defaultValue": null,
            "primaryKey": false
        },
        "passwd": {
            "type": "VARCHAR(32)",
            "allowNull": false,
            "defaultValue": null,
            "primaryKey": false
        },
        "last_passwd_gen": {
            "type": "TIMESTAMP",
            "allowNull": false,
            "defaultValue": "CURRENT_TIMESTAMP",
            "primaryKey": false
        },
        "stats_date_from": {
            "type": "DATE",
            "allowNull": true,
            "defaultValue": null,
            "primaryKey": false
        },
        "stats_date_to": {
            "type": "DATE",
            "allowNull": true,
            "defaultValue": null,
            "primaryKey": false
        },
        "stats_compare_from": {
            "type": "DATE",
            "allowNull": true,
            "defaultValue": null,
            "primaryKey": false
        },
        "stats_compare_to": {
            "type": "DATE",
            "allowNull": true,
            "defaultValue": null,
            "primaryKey": false
        },
        "stats_compare_option": {
            "type": "INT(1) UNSIGNED",
            "allowNull": false,
            "defaultValue": "1",
            "primaryKey": false
        },
        "preselect_date_range": {
            "type": "VARCHAR(32)",
            "allowNull": true,
            "defaultValue": null,
            "primaryKey": false
        },
        "bo_color": {
            "type": "VARCHAR(32)",
            "allowNull": true,
            "defaultValue": null,
            "primaryKey": false
        },
        "bo_theme": {
            "type": "VARCHAR(32)",
            "allowNull": true,
            "defaultValue": null,
            "primaryKey": false
        },
        "bo_css": {
            "type": "VARCHAR(64)",
            "allowNull": true,
            "defaultValue": null,
            "primaryKey": false
        },
        "default_tab": {
            "type": "INT(10) UNSIGNED",
            "allowNull": false,
            "defaultValue": "0",
            "primaryKey": false
        },
        "bo_width": {
            "type": "INT(10) UNSIGNED",
            "allowNull": false,
            "defaultValue": "0",
            "primaryKey": false
        },
        "bo_menu": {
            "type": "TINYINT(1)",
            "allowNull": false,
            "defaultValue": "1",
            "primaryKey": false
        },
        "active": {
            "type": "TINYINT(1) UNSIGNED",
            "allowNull": false,
            "defaultValue": "0",
            "primaryKey": false
        },
        "optin": {
            "type": "TINYINT(1) UNSIGNED",
            "allowNull": false,
            "defaultValue": "1",
            "primaryKey": false
        },
        "id_last_order": {
            "type": "INT(10) UNSIGNED",
            "allowNull": false,
            "defaultValue": "0",
            "primaryKey": false
        },
        "id_last_customer_message": {
            "type": "INT(10) UNSIGNED",
            "allowNull": false,
            "defaultValue": "0",
            "primaryKey": false
        },
        "id_last_customer": {
            "type": "INT(10) UNSIGNED",
            "allowNull": false,
            "defaultValue": "0",
            "primaryKey": false
        },
        "last_connection_date": {
            "type": "DATE",
            "allowNull": true,
            "defaultValue": "0000-00-00",
            "primaryKey": false
        }
    },{
        tableName:'ps_employee',
        timestamps:true,
        createdAt:false,
        updatedAt:false,
        deletedAt:false,
        underscored:true,
        scopes:{
            admin:{
                attributes:[
                    'id_employee',
                    'id_profile',
                    'id_lang',
                    'lastname',
                    'firstname',
                    'email',
                    'passwd',
                    'id_last_customer',
                    'id_last_order'
                ]
            },
            messenger:{
                attributes:[
                    'id_employee',
                    'email',
                    'lastname',
                    'firstname'
                ]
            }

        }
    });

}