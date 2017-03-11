module.exports.RangeWeightFunc = function(Sequelize,sequelize){
    return sequelize.define('RangeWeight',{
        "id_range_weight": {
            "type": "INT(10) UNSIGNED",
            "allowNull": false,
            "defaultValue": null,
            "primaryKey": true
        },
        "id_carrier": {
            "type": "INT(10) UNSIGNED",
            "allowNull": false,
            "defaultValue": null,
            "primaryKey": false
        },
        "delimiter1": {
            "type": "DECIMAL(20,6)",
            "allowNull": false,
            "defaultValue": null,
            "primaryKey": false
        },
        "delimiter2": {
            "type": "DECIMAL(20,6)",
            "allowNull": false,
            "defaultValue": null,
            "primaryKey": false
        }
    },{
        tableName:'ps_range_weight',
        timestamps:false,
        createdAt:false,
        updatedAt:false,
        deletedAt:false,
        underscored:true,
        scopes:{
            admin:{
                attributes:[
                    'id_range_weight',
                    'id_carrier',
                    'delimiter1',
                    'delimiter2'
                ]
            }
        }
    });

}