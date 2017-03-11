module.exports.RangePriceFunc = function(Sequelize,sequelize){
    return sequelize.define('RangePrice',{
        "id_range_price": {
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
        tableName:'ps_range_price',
        timestamps:false,
        createdAt:false,
        updatedAt:false,
        deletedAt:false,
        underscored:true,
        scopes:{
            admin:{
                attributes:[
                    'id_range_price',
                    'id_carrier',
                    'delimiter1',
                    'delimiter2'
                ]
            }
        }
    });

}