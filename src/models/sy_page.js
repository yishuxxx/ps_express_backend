module.exports.SYPageFunc = function(Sequelize,sequelize){

    return sequelize.define('SYPage',{
        "id_sypage": {
            "type": "INT(10) UNSIGNED",
            "allowNull": false,
            "defaultValue": null,
            "primaryKey": true
        },
        "prefix": {
            "type": "VARCHAR(2)",
            "allowNull": false,
            "defaultValue": null,
            "primaryKey": false
        },
        "name": {
            "type": "VARCHAR(20)",
            "allowNull": false,
            "defaultValue": null,
            "primaryKey": false
        },
        "fbpage_page_id": {
            "type": "VARCHAR(20)",
            "allowNull": true,
            "defaultValue": null,
            "primaryKey": false
        },
        "invoice_no_latest": {
            "type": "INT(10) UNSIGNED",
            "allowNull": true,
            "defaultValue": null,
            "primaryKey": false
        }

    },{
        tableName:'sy_page',
        timestamps:false,
        createdAt:false,
        updatedAt:false,
        deletedAt:false,
        underscored:true,
        scopes:{
            admin:{
                attributes:['id_sypage','prefix','name','fbpage_page_id','invoice_no_latest']
            }
        }
    });

};