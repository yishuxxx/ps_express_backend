module.exports.TaxRuleFunc = function(Sequelize,sequelize){
    return sequelize.define('TaxRule',{
    "id_tax_rule": {
        "type": "INT(11)",
        "allowNull": false,
        "defaultValue": null,
        "primaryKey": true
    },
    "id_tax_rules_group": {
        "type": "INT(11)",
        "allowNull": false,
        "defaultValue": null,
        "primaryKey": false
    },
    "id_country": {
        "type": "INT(11)",
        "allowNull": false,
        "defaultValue": null,
        "primaryKey": false
    },
    "id_state": {
        "type": "INT(11)",
        "allowNull": false,
        "defaultValue": null,
        "primaryKey": false
    },
    "zipcode_from": {
        "type": "VARCHAR(12)",
        "allowNull": false,
        "defaultValue": null,
        "primaryKey": false
    },
    "zipcode_to": {
        "type": "VARCHAR(12)",
        "allowNull": false,
        "defaultValue": null,
        "primaryKey": false
    },
    "id_tax": {
        "type": "INT(11)",
        "allowNull": false,
        "defaultValue": null,
        "primaryKey": false
    },
    "behavior": {
        "type": "INT(11)",
        "allowNull": false,
        "defaultValue": null,
        "primaryKey": false
    },
    "description": {
        "type": "VARCHAR(100)",
        "allowNull": false,
        "defaultValue": null,
        "primaryKey": false
    }
},{
        tableName:'ps_tax_rule',
        timestamps:false,
        createdAt:false,
        updatedAt:false,
        deletedAt:false,
        underscored:true,
        scopes:{
            admin:{
                attributes:['id_tax_rule','id_tax_rules_group','id_tax']
            }
        }
    });

}
