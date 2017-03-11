module.exports.CarrierFunc = function(Sequelize,sequelize){
    return sequelize.define('Carrier',{
        "id_carrier": {
            "type": "INT(10) UNSIGNED",
            "allowNull": false,
            "defaultValue": null,
            "primaryKey": true
        },
        "id_reference": {
            "type": "INT(10) UNSIGNED",
            "allowNull": false,
            "defaultValue": null,
            "primaryKey": false
        },
        "id_tax_rules_group": {
            "type": "INT(10) UNSIGNED",
            "allowNull": true,
            "defaultValue": "0",
            "primaryKey": false
        },
        "name": {
            "type": "VARCHAR(64)",
            "allowNull": false,
            "defaultValue": null,
            "primaryKey": false
        },
        "url": {
            "type": "VARCHAR(255)",
            "allowNull": true,
            "defaultValue": null,
            "primaryKey": false
        },
        "active": {
            "type": "TINYINT(1) UNSIGNED",
            "allowNull": false,
            "defaultValue": "0",
            "primaryKey": false
        },
        "deleted": {
            "type": "TINYINT(1) UNSIGNED",
            "allowNull": false,
            "defaultValue": "0",
            "primaryKey": false
        },
        "shipping_handling": {
            "type": "TINYINT(1) UNSIGNED",
            "allowNull": false,
            "defaultValue": "1",
            "primaryKey": false
        },
        "range_behavior": {
            "type": "TINYINT(1) UNSIGNED",
            "allowNull": false,
            "defaultValue": "0",
            "primaryKey": false
        },
        "is_module": {
            "type": "TINYINT(1) UNSIGNED",
            "allowNull": false,
            "defaultValue": "0",
            "primaryKey": false
        },
        "is_free": {
            "type": "TINYINT(1) UNSIGNED",
            "allowNull": false,
            "defaultValue": "0",
            "primaryKey": false
        },
        "shipping_external": {
            "type": "TINYINT(1) UNSIGNED",
            "allowNull": false,
            "defaultValue": "0",
            "primaryKey": false
        },
        "need_range": {
            "type": "TINYINT(1) UNSIGNED",
            "allowNull": false,
            "defaultValue": "0",
            "primaryKey": false
        },
        "external_module_name": {
            "type": "VARCHAR(64)",
            "allowNull": true,
            "defaultValue": null,
            "primaryKey": false
        },
        "shipping_method": {
            "type": "INT(2)",
            "allowNull": false,
            "defaultValue": "0",
            "primaryKey": false
        },
        "position": {
            "type": "INT(10) UNSIGNED",
            "allowNull": false,
            "defaultValue": "0",
            "primaryKey": false
        },
        "max_width": {
            "type": "INT(10)",
            "allowNull": true,
            "defaultValue": "0",
            "primaryKey": false
        },
        "max_height": {
            "type": "INT(10)",
            "allowNull": true,
            "defaultValue": "0",
            "primaryKey": false
        },
        "max_depth": {
            "type": "INT(10)",
            "allowNull": true,
            "defaultValue": "0",
            "primaryKey": false
        },
        "max_weight": {
            "type": "DECIMAL(20,6)",
            "allowNull": true,
            "defaultValue": "0.000000",
            "primaryKey": false
        },
        "grade": {
            "type": "INT(10)",
            "allowNull": true,
            "defaultValue": "0",
            "primaryKey": false
        }
    },{
        tableName:'ps_carrier',
        timestamps:false,
        createdAt:false,
        updatedAt:false,
        deletedAt:false,
        underscored:true,
        scopes:{
            admin:{
                attributes:[
                'id_carrier',
                'id_reference',
                'id_tax_rules_group',
                'name',
                'url',
                'is_free'
                ]
            }
        }
    });

}