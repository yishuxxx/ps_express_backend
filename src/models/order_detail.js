var OrderDetail = function(Sequelize,sequelize){
    return sequelize.define('OrderDetail',{
	"id_order_detail": {
		"type": "INT(10) UNSIGNED",
		"allowNull": false,
		"defaultValue": null,
		"primaryKey": true,
		"autoIncrement":true
	},
	"id_order": {
		"type": "INT(10) UNSIGNED",
		"allowNull": false,
		"defaultValue": null,
		"primaryKey": false,
        "validate": {
            notEmpty: true,
        }
	},
	"id_order_invoice": {
		"type": "INT(11)",
		"allowNull": true,
		"defaultValue": 0,
		"primaryKey": false
	},
	"id_warehouse": {
		"type": "INT(10) UNSIGNED",
		"allowNull": true,
		"defaultValue": 0,
		"primaryKey": false
	},
	"id_shop": {
		"type": "INT(11) UNSIGNED",
		"allowNull": false,
		"defaultValue": 1,
		"primaryKey": false
	},
	"product_id": {
		"type": "INT(10) UNSIGNED",
		"allowNull": false,
		"defaultValue": null,
		"primaryKey": false,
        "validate": {
            notEmpty: true,
        }
	},
	"product_attribute_id": {
		"type": "INT(10) UNSIGNED",
		"allowNull": true,
		"defaultValue": null,
		"primaryKey": false,
        "validate": {
            notEmpty: true,
        }
	},
	"product_name": {
		"type": "VARCHAR(255)",
		"allowNull": false,
		"defaultValue": null,
		"primaryKey": false,
        "validate": {
            notEmpty: true,
        }
	},
	"product_quantity": {
		"type": "INT(10) UNSIGNED",
		"allowNull": false,
		"defaultValue": "0",
		"primaryKey": false,
        "validate": {
            notEmpty: true,
        }
	},
	"product_quantity_in_stock": {
		"type": "INT(10)",
		"allowNull": false,
		"defaultValue": "0",
		"primaryKey": false
	},
	"product_quantity_refunded": {
		"type": "INT(10) UNSIGNED",
		"allowNull": false,
		"defaultValue": "0",
		"primaryKey": false
	},
	"product_quantity_return": {
		"type": "INT(10) UNSIGNED",
		"allowNull": false,
		"defaultValue": "0",
		"primaryKey": false
	},
	"product_quantity_reinjected": {
		"type": "INT(10) UNSIGNED",
		"allowNull": false,
		"defaultValue": "0",
		"primaryKey": false
	},
	"product_price": {
		"type": "DECIMAL(20,6)",
		"allowNull": false,
		"defaultValue": "0.000000",
		"primaryKey": false,
        "validate": {
            notEmpty: true,
        }
	},
	"reduction_percent": {
		"type": "DECIMAL(10,2)",
		"allowNull": false,
		"defaultValue": "0.00",
		"primaryKey": false
	},
	"reduction_amount": {
		"type": "DECIMAL(20,6)",
		"allowNull": false,
		"defaultValue": "0.000000",
		"primaryKey": false
	},
	"reduction_amount_tax_incl": {
		"type": "DECIMAL(20,6)",
		"allowNull": false,
		"defaultValue": "0.000000",
		"primaryKey": false
	},
	"reduction_amount_tax_excl": {
		"type": "DECIMAL(20,6)",
		"allowNull": false,
		"defaultValue": "0.000000",
		"primaryKey": false
	},
	"group_reduction": {
		"type": "DECIMAL(10,2)",
		"allowNull": false,
		"defaultValue": "0.00",
		"primaryKey": false
	},
	"product_quantity_discount": {
		"type": "DECIMAL(20,6)",
		"allowNull": false,
		"defaultValue": "0.000000",
		"primaryKey": false
	},
	"product_ean13": {
		"type": "VARCHAR(13)",
		"allowNull": true,
		"defaultValue": "",
		"primaryKey": false
	},
	"product_upc": {
		"type": "VARCHAR(12)",
		"allowNull": true,
		"defaultValue": "",
		"primaryKey": false
	},
	"product_reference": {
		"type": "VARCHAR(32)",
		"allowNull": true,
		"defaultValue": null,
		"primaryKey": false
	},
	"product_supplier_reference": {
		"type": "VARCHAR(32)",
		"allowNull": true,
		"defaultValue": "",
		"primaryKey": false
	},
	"product_weight": {
		"type": "DECIMAL(20,6)",
		"allowNull": false,
		"defaultValue": null,
		"primaryKey": false
	},
	"id_tax_rules_group": {
		"type": "INT(11) UNSIGNED",
		"allowNull": true,
		"defaultValue": "0",
		"primaryKey": false
	},
	"tax_computation_method": {
		"type": "TINYINT(1) UNSIGNED",
		"allowNull": false,
		"defaultValue": "0",
		"primaryKey": false
	},
	"tax_name": {
		"type": "VARCHAR(16)",
		"allowNull": false,
		"defaultValue": "",
		"primaryKey": false
	},
	"tax_rate": {
		"type": "DECIMAL(10,3)",
		"allowNull": false,
		"defaultValue": "0.000",
		"primaryKey": false
	},
	"ecotax": {
		"type": "DECIMAL(21,6)",
		"allowNull": false,
		"defaultValue": "0.000000",
		"primaryKey": false
	},
	"ecotax_tax_rate": {
		"type": "DECIMAL(5,3)",
		"allowNull": false,
		"defaultValue": "0.000",
		"primaryKey": false
	},
	"discount_quantity_applied": {
		"type": "TINYINT(1)",
		"allowNull": false,
		"defaultValue": "0",
		"primaryKey": false
	},
	"download_hash": {
		"type": "VARCHAR(255)",
		"allowNull": true,
		"defaultValue": "",
		"primaryKey": false
	},
	"download_nb": {
		"type": "INT(10) UNSIGNED",
		"allowNull": true,
		"defaultValue": "0",
		"primaryKey": false
	},
	"download_deadline": {
		"type": "DATETIME",
		"allowNull": true,
		"defaultValue": "0000-00-00 00:00:00",
		"primaryKey": false
	},
	"total_price_tax_incl": {
		"type": "DECIMAL(20,6)",
		"allowNull": false,
		"defaultValue": "0.000000",
		"primaryKey": false
	},
	"total_price_tax_excl": {
		"type": "DECIMAL(20,6)",
		"allowNull": false,
		"defaultValue": "0.000000",
		"primaryKey": false
	},
	"unit_price_tax_incl": {
		"type": "DECIMAL(20,6)",
		"allowNull": false,
		"defaultValue": "0.000000",
		"primaryKey": false
	},
	"unit_price_tax_excl": {
		"type": "DECIMAL(20,6)",
		"allowNull": false,
		"defaultValue": "0.000000",
		"primaryKey": false
	},
	"total_shipping_price_tax_incl": {
		"type": "DECIMAL(20,6)",
		"allowNull": false,
		"defaultValue": "0.000000",
		"primaryKey": false
	},
	"total_shipping_price_tax_excl": {
		"type": "DECIMAL(20,6)",
		"allowNull": false,
		"defaultValue": "0.000000",
		"primaryKey": false
	},
	"purchase_supplier_price": {
		"type": "DECIMAL(20,6)",
		"allowNull": false,
		"defaultValue": "0.000000",
		"primaryKey": false
	},
	"original_product_price": {
		"type": "DECIMAL(20,6)",
		"allowNull": false,
		"defaultValue": "0.000000",
		"primaryKey": false
	},
	"original_wholesale_price": {
		"type": "DECIMAL(20,6)",
		"allowNull": false,
		"defaultValue": "0.000000",
		"primaryKey": false
	}
},{
        tableName:'ps_order_detail',
        timestamps:false,
        createdAt:false,
        updatedAt:false,
        deletedAt:false,
        underscored:true,
        scopes:{
            admin:{
                attributes:['id_order_detail','id_order','id_order_invoice','product_id',
                'product_attribute_id','product_reference','product_name','product_quantity',
                'product_price',
                'product_weight',
                'original_product_price',
                'original_wholesale_price',
                'total_price_tax_incl',
                'total_price_tax_excl',
                'unit_price_tax_incl',
                'unit_price_tax_excl'
                ]
            }
        }
    });

}

module.exports.OrderDetailFunc = OrderDetail;
