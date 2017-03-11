module.exports.TaxLangFunc = function(Sequelize,sequelize){
    return sequelize.define('TaxLang',{
	"id_tax": {
		"type": "INT(10) UNSIGNED",
		"allowNull": false,
		"defaultValue": null,
		"primaryKey": true
	},
	"id_lang": {
		"type": "INT(10) UNSIGNED",
		"allowNull": false,
		"defaultValue": null,
		"primaryKey": true
	},
	"name": {
		"type": "VARCHAR(32)",
		"allowNull": false,
		"defaultValue": null,
		"primaryKey": false
	}
},{
        tableName:'ps_tax_lang',
        timestamps:true,
        createdAt:false,
        updatedAt:false,
        deletedAt:false,
        underscored:true,
        scopes:{
            admin:{
                attributes:['id_tax','id_lang','name']
            }
        }
    });

}