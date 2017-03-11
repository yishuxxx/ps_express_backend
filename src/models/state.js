module.exports.StateFunc = function(Sequelize,sequelize){
    return sequelize.define('State',{
        "id_state": {
            "type": "INT(10) UNSIGNED",
            "allowNull": false,
            "defaultValue": null,
            "primaryKey": true
        },
        "id_country": {
            "type": "INT(11) UNSIGNED",
            "allowNull": false,
            "defaultValue": null,
            "primaryKey": false
        },
        "id_zone": {
            "type": "INT(11) UNSIGNED",
            "allowNull": false,
            "defaultValue": null,
            "primaryKey": false
        },
        "name": {
            "type": "VARCHAR(64)",
            "allowNull": false,
            "defaultValue": null,
            "primaryKey": false
        },
        "iso_code": {
            "type": "VARCHAR(7)",
            "allowNull": false,
            "defaultValue": null,
            "primaryKey": false
        },
        "tax_behavior": {
            "type": "SMALLINT(1)",
            "allowNull": false,
            "defaultValue": "0",
            "primaryKey": false
        },
        "active": {
            "type": "TINYINT(1)",
            "allowNull": false,
            "defaultValue": "0",
            "primaryKey": false
        }
    },{
        tableName:'ps_state',
        timestamps:true,
        createdAt:false,
        updatedAt:false,
        deletedAt:false,
        underscored:true,
        scopes:{
            admin:{
                attributes:['id_state','id_country','id_zone','iso_code','name']
            }
        }
    });

}