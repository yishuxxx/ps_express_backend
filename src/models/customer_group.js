module.exports.CustomerGroupFunc = function(Sequelize,sequelize){
    return sequelize.define('CustomerGroup',{
        "id_customer": {
            "type": "INT(10) UNSIGNED",
            "allowNull": false,
            "defaultValue": null,
            "primaryKey": true
        },
        "id_group": {
            "type": "INT(10) UNSIGNED",
            "allowNull": false,
            "defaultValue": null,
            "primaryKey": true
        }
    },{
        tableName:'ps_customer_group',
        timestamps:true,
        createdAt:false,
        updatedAt:false,
        deletedAt:false,
        underscored:true,
        scopes:{
            admin:{
                attributes:['id_customer','id_group']
            }
        }
    });

}