module.exports.TaxFunc = function(Sequelize,sequelize){
    return sequelize.define('Tax',{
    "id_tax": {
        "type": "INT(10) UNSIGNED",
        "allowNull": false,
        "defaultValue": null,
        "primaryKey": true
    },
    "rate": {
        "type": "DECIMAL(10,3)",
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
        tableName:'ps_tax',
        timestamps:false,
        createdAt:false,
        updatedAt:false,
        deletedAt:false,
        underscored:true,
        scopes:{
            admin:{
                attributes:['id_tax','rate']
            }
        }
    });

}
