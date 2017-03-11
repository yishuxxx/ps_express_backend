var OrderStateLang = function(Sequelize,sequelize){
    return sequelize.define('OrderStateLang',{
    "id_order_state": {
        "type": "INT(10) UNSIGNED",
        "allowNull": false,
        "defaultValue": null,
        "primaryKey": true
    },
    "id_lang": {
        "type": "INT(10) UNSIGNED",
        "allowNull": false,
        "defaultVaalue": null,
        "primaryKey": true
    },
    "name": {
        "type": "VARCHAR(64)",
        "allowNull": false,
        "defaultValue": null,
        "primaryKey": false
    },
    "template": {
        "type": "VARCHAR(64)",
        "allowNull": false,
        "defaultValue": null,
        "primaryKey": false
    }
},{
        tableName:'ps_order_state_lang',
        timestamps:false,
        createdAt:false,
        updatedAt:false,
        deletedAt:false,
        underscored:true,
        scopes:{
            admin:{
                attributes:['id_order_state','name']
            }
        }
    });

}

module.exports.OrderStateLangFunc = OrderStateLang;
