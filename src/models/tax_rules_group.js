module.exports.TaxRulesGroupFunc = function(Sequelize,sequelize){
    return sequelize.define('TaxRulesGroup',{
    "id_tax_rules_group": {
        "type": "INT(11)",
        "allowNull": false,
        "defaultValue": null,
        "primaryKey": true
    },
    "name": {
        "type": "VARCHAR(50)",
        "allowNull": false,
        "defaultValue": null,
        "primaryKey": false
    },
    "active": {
        "type": "INT(11)",
        "allowNull": false,
        "defaultValue": null,
        "primaryKey": false
    },
    "deleted": {
        "type": "TINYINT(1) UNSIGNED",
        "allowNull": false,
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
    }
},{
        tableName:'ps_tax_rules_group',
        timestamps:true,
        createdAt:"date_add",
        updatedAt:"date_upd",
        deletedAt:false,
        underscored:true,
        scopes:{
            admin:{
                attributes:['id_tax_rules_group','name']
            }
        }
    });

}


