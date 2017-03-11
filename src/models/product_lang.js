module.exports.ProductLangFunc = function(Sequelize,sequelize){
    return sequelize.define('ProductLang',{
    "id_product": {
        "type": "INT(10) UNSIGNED",
        "allowNull": false,
        "defaultValue": null,
        "primaryKey": true
    },
    "id_shop": {
        "type": "INT(11) UNSIGNED",
        "allowNull": false,
        "defaultValue": "1",
        "primaryKey": true
    },
    "id_lang": {
        "type": "INT(10) UNSIGNED",
        "allowNull": false,
        "defaultValue": null,
        "primaryKey": true
    },
    "description": {
        "type": "TEXT",
        "allowNull": true,
        "defaultValue": null,
        "primaryKey": false
    },
    "description_short": {
        "type": "TEXT",
        "allowNull": true,
        "defaultValue": null,
        "primaryKey": false
    },
    "link_rewrite": {
        "type": "VARCHAR(128)",
        "allowNull": false,
        "defaultValue": null,
        "primaryKey": false
    },
    "meta_description": {
        "type": "VARCHAR(255)",
        "allowNull": true,
        "defaultValue": null,
        "primaryKey": false
    },
    "meta_keywords": {
        "type": "VARCHAR(255)",
        "allowNull": true,
        "defaultValue": null,
        "primaryKey": false
    },
    "meta_title": {
        "type": "VARCHAR(128)",
        "allowNull": true,
        "defaultValue": null,
        "primaryKey": false
    },
    "name": {
        "type": "VARCHAR(128)",
        "allowNull": false,
        "defaultValue": null,
        "primaryKey": false
    },
    "available_now": {
        "type": "VARCHAR(255)",
        "allowNull": true,
        "defaultValue": null,
        "primaryKey": false
    },
    "available_later": {
        "type": "VARCHAR(255)",
        "allowNull": true,
        "defaultValue": null,
        "primaryKey": false
    }
},{
        tableName:'ps_product_lang',
        timestamps:false,
        createdAt:false,
        updatedAt:false,
        deletedAt:false,
        underscored:true,
        scopes:{
            admin:{
                attributes:['id_product','id_lang','name','description','description_short']
            }
        }
    });

}


