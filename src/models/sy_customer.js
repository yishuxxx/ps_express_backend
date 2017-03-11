module.exports.SYCustomerFunc = function(Sequelize,sequelize){

    return sequelize.define('SYCustomer',{
        "id_sycustomer": {
            "type": "INT(10) UNSIGNED",
            "allowNull": false,
            "defaultValue": null,
            "primaryKey": true
        },
        "id_customer": {
            "type": "INT(10) UNSIGNED",
            "allowNull": false,
            "defaultValue": null,
            "primaryKey": false
        },
        "fbuser_id": {
            "type": "VARCHAR(20)",
            "allowNull": false,
            "defaultValue": null,
            "primaryKey": false
        },
        "fbuser_name": {
            "type": "VARCHAR(32)",
            "allowNull": false,
            "defaultValue": null,
            "primaryKey": false
        }
    },{
        tableName:'sy_customer',
        timestamps:true,
        createdAt:false,
        updatedAt:false,
        deletedAt:false,
        underscored:true,
        scopes:{
            admin:{
                attributes:['id_sycustomer','id_customer','fbuser_id','fbuser_name']
            }
        }
    });

};