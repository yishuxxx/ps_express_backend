module.exports.CountryFunc = function(Sequelize,sequelize){
    return sequelize.define('Country',{
        "id_country": {
            "type": "INT(10) UNSIGNED",
            "allowNull": false,
            "defaultValue": null,
            "primaryKey": true
        },
        "id_zone": {
            "type": "INT(10) UNSIGNED",
            "allowNull": false,
            "defaultValue": null,
            "primaryKey": false
        },
        "id_currency": {
            "type": "INT(10) UNSIGNED",
            "allowNull": false,
            "defaultValue": "0",
            "primaryKey": false
        },
        "iso_code": {
            "type": "VARCHAR(3)",
            "allowNull": false,
            "defaultValue": null,
            "primaryKey": false
        },
        "call_prefix": {
            "type": "INT(10)",
            "allowNull": false,
            "defaultValue": "0",
            "primaryKey": false
        },
        "active": {
            "type": "TINYINT(1) UNSIGNED",
            "allowNull": false,
            "defaultValue": "0",
            "primaryKey": false
        },
        "contains_states": {
            "type": "TINYINT(1)",
            "allowNull": false,
            "defaultValue": "0",
            "primaryKey": false
        },
        "need_identification_number": {
            "type": "TINYINT(1)",
            "allowNull": false,
            "defaultValue": "0",
            "primaryKey": false
        },
        "need_zip_code": {
            "type": "TINYINT(1)",
            "allowNull": false,
            "defaultValue": "1",
            "primaryKey": false
        },
        "zip_code_format": {
            "type": "VARCHAR(12)",
            "allowNull": false,
            "defaultValue": "",
            "primaryKey": false
        },
        "display_tax_label": {
            "type": "TINYINT(1)",
            "allowNull": false,
            "defaultValue": null,
            "primaryKey": false
        }
    },{
        tableName:'ps_country',
        timestamps:true,
        createdAt:false,
        updatedAt:false,
        deletedAt:false,
        underscored:true,
        scopes:{
            admin:{
                attributes:['id_country','id_zone','iso_code']
            }
        }
    });

}