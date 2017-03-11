module.exports.TaxRulesGroupShopFunc = function(Sequelize,sequelize){
    return sequelize.define('TaxRulesGroupShop',{
    "id_tax_rules_group": {
        "type": "INT(11) UNSIGNED",
        "allowNull": false,
        "defaultValue": null,
        "primaryKey": true
    },
    "id_shop": {
        "type": "INT(11) UNSIGNED",
        "allowNull": false,
        "defaultValue": null,
        "primaryKey": true
    }
},{
        tableName:'ps_tax_rules_group_shop',
        timestamps:false,
        createdAt:false,
        updatedAt:false,
        deletedAt:false,
        underscored:true,
        scopes:{
            admin:{
                attributes:['id_tax_rules_group','id_shop']
            }
        }
    });

}
