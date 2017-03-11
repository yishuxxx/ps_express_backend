module.exports.AddressFunc = function(Sequelize,sequelize){
    return sequelize.define('Address',{
        "id_address": {
            "type": "INT(10) UNSIGNED",
            "allowNull": false,
            "defaultValue": null,
            "primaryKey": true,
            "autoIncrement": true
        },
        "id_country": {
            "type": "INT(10) UNSIGNED",
            "allowNull": false,
            "defaultValue": null,
            "primaryKey": false
        },
        "id_state": {
            "type": "INT(10) UNSIGNED",
            "allowNull": true,
            "defaultValue": null,
            "primaryKey": false
        },
        "id_customer": {
            "type": "INT(10) UNSIGNED",
            "allowNull": false,
            "defaultValue": "0",
            "primaryKey": false
        },
        "id_manufacturer": {
            "type": "INT(10) UNSIGNED",
            "allowNull": false,
            "defaultValue": "0",
            "primaryKey": false
        },
        "id_supplier": {
            "type": "INT(10) UNSIGNED",
            "allowNull": false,
            "defaultValue": "0",
            "primaryKey": false
        },
        "id_warehouse": {
            "type": "INT(10) UNSIGNED",
            "allowNull": false,
            "defaultValue": "0",
            "primaryKey": false
        },
        "alias": {
            "type": "VARCHAR(32)",
            "allowNull": false,
            "defaultValue": null,
            "primaryKey": false
        },
        "company": {
            "type": "VARCHAR(64)",
            "allowNull": true,
            "defaultValue": "",
            "primaryKey": false
        },
        "lastname": {
            "type": "VARCHAR(32)",
            "allowNull": true,
            "defaultValue": "",
            "primaryKey": false
        },
        "firstname": {
            "type": "VARCHAR(32)",
            "allowNull": false,
            "defaultValue": null,
            "primaryKey": false
        },
        "address1": {
            "type": "VARCHAR(128)",
            "allowNull": false,
            "defaultValue": null,
            "primaryKey": false
        },
        "address2": {
            "type": "VARCHAR(128)",
            "allowNull": true,
            "defaultValue": "",
            "primaryKey": false
        },
        "postcode": {
            "type": "VARCHAR(12)",
            "allowNull": true,
            "defaultValue": null,
            "primaryKey": false
        },
        "city": {
            "type": "VARCHAR(64)",
            "allowNull": true,
            "defaultValue": "",
            "primaryKey": false
        },
        "other": {
            "type": "TEXT",
            "allowNull": true,
            "defaultValue": null,
            "primaryKey": false
        },
        "phone": {
            "type": "VARCHAR(32)",
            "allowNull": true,
            "defaultValue": null,
            "primaryKey": false
        },
        "phone_mobile": {
            "type": "VARCHAR(32)",
            "allowNull": true,
            "defaultValue": null,
            "primaryKey": false
        },
        "vat_number": {
            "type": "VARCHAR(32)",
            "allowNull": true,
            "defaultValue": null,
            "primaryKey": false
        },
        "dni": {
            "type": "VARCHAR(16)",
            "allowNull": true,
            "defaultValue": null,
            "primaryKey": false
        },
        "date_add": {
            "type": "DATETIME",
            "allowNull": false,
            "defaultValue": null,
            "primaryKey": false
        },
        "date_upd": {
            "type": "DATETIME",
            "allowNull": false,
            "defaultValue": null,
            "primaryKey": false
        },
        "active": {
            "type": "TINYINT(1) UNSIGNED",
            "allowNull": false,
            "defaultValue": "1",
            "primaryKey": false
        },
        "deleted": {
            "type": "TINYINT(1) UNSIGNED",
            "allowNull": false,
            "defaultValue": "0",
            "primaryKey": false
        }
    },{
        tableName:'ps_address',
        timestamps:true,
        createdAt:'date_add',
        updatedAt:'date_upd',
        deletedAt:false,
        underscored:true,
        scopes:{
            admin:{
                attributes:['id_address','id_country','id_state','id_customer','date_add','date_upd','firstname','lastname','phone','address1','address2','postcode','city']
            }
        }
    });

}