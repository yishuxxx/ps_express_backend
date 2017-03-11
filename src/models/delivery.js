module.exports.DeliveryFunc = function(Sequelize,sequelize){
    return sequelize.define('Delivery',{
        "id_delivery": {
            "type": "INT(10) UNSIGNED",
            "allowNull": false,
            "defaultValue": null,
            "primaryKey": true
        },
        "id_shop": {
            "type": "INT(10) UNSIGNED",
            "allowNull": true,
            "defaultValue": null,
            "primaryKey": false
        },
        "id_shop_group": {
            "type": "INT(10) UNSIGNED",
            "allowNull": true,
            "defaultValue": null,
            "primaryKey": false
        },
        "id_carrier": {
            "type": "INT(10) UNSIGNED",
            "allowNull": false,
            "defaultValue": null,
            "primaryKey": false
        },
        "id_range_price": {
            "type": "INT(10) UNSIGNED",
            "allowNull": true,
            "defaultValue": null,
            "primaryKey": false
        },
        "id_range_weight": {
            "type": "INT(10) UNSIGNED",
            "allowNull": true,
            "defaultValue": null,
            "primaryKey": false
        },
        "id_zone": {
            "type": "INT(10) UNSIGNED",
            "allowNull": false,
            "defaultValue": null,
            "primaryKey": false
        },
        "price": {
            "type": "DECIMAL(20,6)",
            "allowNull": false,
            "defaultValue": null,
            "primaryKey": false
        }
    },{
        tableName:'ps_delivery',
        timestamps:false,
        createdAt:false,
        updatedAt:false,
        deletedAt:false,
        underscored:true,
        scopes:{
            admin:{
                attributes:[
                    'id_delivery',
                    'id_shop',
                    'id_shop_group',
                    'id_carrier',
                    'id_range_price',
                    'id_range_weight',
                    'id_zone',
                    'price'
                ]
            }
        }
    });

}