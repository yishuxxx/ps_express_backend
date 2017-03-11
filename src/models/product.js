module.exports.ProductFunc = function(Sequelize,sequelize){
    return sequelize.define('Product',{
    "id_product": {
        "type": "INT(10) UNSIGNED",
        "allowNull": false,
        "defaultValue": null,
        "primaryKey": true
    },
    "id_supplier": {
        "type": "INT(10) UNSIGNED",
        "allowNull": true,
        "defaultValue": null,
        "primaryKey": false
    },
    "id_manufacturer": {
        "type": "INT(10) UNSIGNED",
        "allowNull": true,
        "defaultValue": null,
        "primaryKey": false
    },
    "id_category_default": {
        "type": "INT(10) UNSIGNED",
        "allowNull": true,
        "defaultValue": null,
        "primaryKey": false
    },
    "id_shop_default": {
        "type": "INT(10) UNSIGNED",
        "allowNull": false,
        "defaultValue": "1",
        "primaryKey": false
    },
    "id_tax_rules_group": {
        "type": "INT(11) UNSIGNED",
        "allowNull": false,
        "defaultValue": null,
        "primaryKey": false
    },
    "on_sale": {
        "type": "TINYINT(1) UNSIGNED",
        "allowNull": false,
        "defaultValue": "0",
        "primaryKey": false
    },
    "online_only": {
        "type": "TINYINT(1) UNSIGNED",
        "allowNull": false,
        "defaultValue": "0",
        "primaryKey": false
    },
    "ean13": {
        "type": "VARCHAR(13)",
        "allowNull": true,
        "defaultValue": null,
        "primaryKey": false
    },
    "upc": {
        "type": "VARCHAR(12)",
        "allowNull": true,
        "defaultValue": null,
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
    "minimal_quantity": {
        "type": "INT(10) UNSIGNED",
        "allowNull": false,
        "defaultValue": "1",
        "primaryKey": false
    },
    "price": {
        "type": "DECIMAL(20,6)",
        "allowNull": false,
        "defaultValue": "0.000000",
        "primaryKey": false
    },
    "wholesale_price": {
        "type": "DECIMAL(20,6)",
        "allowNull": false,
        "defaultValue": "0.000000",
        "primaryKey": false
    },
    "unity": {
        "type": "VARCHAR(255)",
        "allowNull": true,
        "defaultValue": null,
        "primaryKey": false
    },
    "unit_price_ratio": {
        "type": "DECIMAL(20,6)",
        "allowNull": false,
        "defaultValue": "0.000000",
        "primaryKey": false
    },
    "additional_shipping_cost": {
        "type": "DECIMAL(20,2)",
        "allowNull": false,
        "defaultValue": "0.00",
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
        "defaultValue": null,
        "primaryKey": false
    },
    "location": {
        "type": "VARCHAR(64)",
        "allowNull": true,
        "defaultValue": null,
        "primaryKey": false
    },
    "width": {
        "type": "DECIMAL(20,6)",
        "allowNull": false,
        "defaultValue": "0.000000",
        "primaryKey": false
    },
    "height": {
        "type": "DECIMAL(20,6)",
        "allowNull": false,
        "defaultValue": "0.000000",
        "primaryKey": false
    },
    "depth": {
        "type": "DECIMAL(20,6)",
        "allowNull": false,
        "defaultValue": "0.000000",
        "primaryKey": false
    },
    "weight": {
        "type": "DECIMAL(20,6)",
        "allowNull": false,
        "defaultValue": "0.000000",
        "primaryKey": false
    },
    "out_of_stock": {
        "type": "INT(10) UNSIGNED",
        "allowNull": false,
        "defaultValue": "2",
        "primaryKey": false
    },
    "quantity_discount": {
        "type": "TINYINT(1)",
        "allowNull": true,
        "defaultValue": "0",
        "primaryKey": false
    },
    "customizable": {
        "type": "TINYINT(2)",
        "allowNull": false,
        "defaultValue": "0",
        "primaryKey": false
    },
    "uploadable_files": {
        "type": "TINYINT(4)",
        "allowNull": false,
        "defaultValue": "0",
        "primaryKey": false
    },
    "text_fields": {
        "type": "TINYINT(4)",
        "allowNull": false,
        "defaultValue": "0",
        "primaryKey": false
    },
    "active": {
        "type": "TINYINT(1) UNSIGNED",
        "allowNull": false,
        "defaultValue": "0",
        "primaryKey": false
    },
    "redirect_type": {
        "type": "ENUM('','404','301','302')",
        "allowNull": false,
        "defaultValue": "",
        "primaryKey": false
    },
    "id_product_redirected": {
        "type": "INT(10) UNSIGNED",
        "allowNull": false,
        "defaultValue": "0",
        "primaryKey": false
    },
    "available_for_order": {
        "type": "TINYINT(1)",
        "allowNull": false,
        "defaultValue": "1",
        "primaryKey": false
    },
    "available_date": {
        "type": "DATE",
        "allowNull": false,
        "defaultValue": "0000-00-00",
        "primaryKey": false
    },
    "condition": {
        "type": "ENUM('new','used','refurbished')",
        "allowNull": false,
        "defaultValue": "new",
        "primaryKey": false
    },
    "show_price": {
        "type": "TINYINT(1)",
        "allowNull": false,
        "defaultValue": "1",
        "primaryKey": false
    },
    "indexed": {
        "type": "TINYINT(1)",
        "allowNull": false,
        "defaultValue": "0",
        "primaryKey": false
    },
    "visibility": {
        "type": "ENUM('both','catalog','search','none')",
        "allowNull": false,
        "defaultValue": "both",
        "primaryKey": false
    },
    "cache_is_pack": {
        "type": "TINYINT(1)",
        "allowNull": false,
        "defaultValue": "0",
        "primaryKey": false
    },
    "cache_has_attachments": {
        "type": "TINYINT(1)",
        "allowNull": false,
        "defaultValue": "0",
        "primaryKey": false
    },
    "is_virtual": {
        "type": "TINYINT(1)",
        "allowNull": false,
        "defaultValue": "0",
        "primaryKey": false
    },
    "cache_default_attribute": {
        "type": "INT(10) UNSIGNED",
        "allowNull": true,
        "defaultValue": null,
        "primaryKey": false
    },
    "date_add": {
        "type": "DATETIME",
        "allowNull": false,
        "defaultValue": null,
        "primaryKey": false
    },
    "date_upd": {
        "type": "DATETIME",
        "allowNull": false,
        "defaultValue": null,
        "primaryKey": false
    },
    "advanced_stock_management": {
        "type": "TINYINT(1)",
        "allowNull": false,
        "defaultValue": "0",
        "primaryKey": false
    },
    "pack_stock_type": {
        "type": "INT(11) UNSIGNED",
        "allowNull": false,
        "defaultValue": "3",
        "primaryKey": false
    }
},{
        tableName:'ps_product',
        timestamps:true,
        createdAt:'date_add',
        updatedAt:'date_upd',
        deletedAt:false,
        underscored:true,
        scopes:{
            admin:{
                attributes:['id_product','id_tax_rules_group','on_sale','quantity','price','wholesale_price','reference','width','height','depth','weight','active']
            }
        }
    });

}


