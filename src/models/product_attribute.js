module.exports.ProductAttributeFunc = function(Sequelize,sequelize){
    return sequelize.define('ProductAttribute',{
    "id_product_attribute": {
        "type": "INT(10) UNSIGNED",
        "allowNull": false,
        "defaultValue": null,
        "primaryKey": true
    },
    "id_product": {
        "type": "INT(10) UNSIGNED",
        "allowNull": false,
        "defaultValue": null,
        "primaryKey": false
    },
    "reference": {
        "type": "VARCHAR(32)",
        "allowNull": true,
        "defaultValue": null,
        "primaryKey": false
    },
    "supplier_reference": {
        "type": "VARCHAR(32)",
        "allowNull": true,
        "defaultValue": "",
        "primaryKey": false
    },
    "location": {
        "type": "VARCHAR(64)",
        "allowNull": true,
        "defaultValue": null,
        "primaryKey": false
    },
    "ean13": {
        "type": "VARCHAR(13)",
        "allowNull": true,
        "defaultValue": "",
        "primaryKey": false
    },
    "upc": {
        "type": "VARCHAR(12)",
        "allowNull": true,
        "defaultValue": "",
        "primaryKey": false
    },
    "wholesale_price": {
        "type": "DECIMAL(20,6)",
        "allowNull": false,
        "defaultValue": "0.000000",
        "primaryKey": false
    },
    "price": {
        "type": "DECIMAL(20,6)",
        "allowNull": false,
        "defaultValue": "0.000000",
        "primaryKey": false
    },
    "ecotax": {
        "type": "DECIMAL(17,6)",
        "allowNull": false,
        "defaultValue": "0.000000",
        "primaryKey": false
    },
    "quantity": {
        "type": "INT(10)",
        "allowNull": false,
        "defaultValue": "0",
        "primaryKey": false
    },
    "weight": {
        "type": "DECIMAL(20,6)",
        "allowNull": false,
        "defaultValue": "0.000000",
        "primaryKey": false
    },
    "unit_price_impact": {
        "type": "DECIMAL(20,6)",
        "allowNull": false,
        "defaultValue": "0.000000",
        "primaryKey": false
    },
    "default_on": {
        "type": "TINYINT(1) UNSIGNED",
        "allowNull": true,
        "defaultValue": null,
        "primaryKey": false
    },
    "minimal_quantity": {
        "type": "INT(10) UNSIGNED",
        "allowNull": false,
        "defaultValue": "1",
        "primaryKey": false
    },
    "available_date": {
        "type": "DATE",
        "allowNull": false,
        "defaultValue": "0000-00-00",
        "primaryKey": false
    }
},{
        tableName:'ps_product_attribute',
        timestamps:false,
        createdAt:false,
        updatedAt:false,
        deletedAt:false,
        underscored:true,
        scopes:{
            admin:{
                attributes:['id_product_attribute','id_product','reference','price','wholesale_price','quantity','weight','unit_price_impact']
            }
        }
    });

}


