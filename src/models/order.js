var Order = function(Sequelize,sequelize){
    return sequelize.define('Order',{
	"id_order": {
		"type": "INT(10) UNSIGNED",
		"allowNull": false,
		"defaultValue": null,
		"primaryKey": true,
		"autoIncrement": true
	},
	"reference": {
		"type": "VARCHAR(9)",
		"allowNull": true,
		"defaultValue": null,
		"primaryKey": true
	},
	"id_shop_group": {
		"type": "INT(11) UNSIGNED",
		"allowNull": false,
		"defaultValue": "1",
		"primaryKey": false
	},
	"id_shop": {
		"type": "INT(11) UNSIGNED",
		"allowNull": false,
		"defaultValue": "1",
		"primaryKey": false
	},
	"id_carrier": {
		"type": "INT(10) UNSIGNED",
		"allowNull": true,
		"defaultValue": null,
		"primaryKey": false
	},
	"id_lang": {
		"type": "INT(10) UNSIGNED",
		"allowNull": true,
		"defaultValue": 1,
		"primaryKey": false
	},
	"id_customer": {
		"type": "INT(10) UNSIGNED",
		"allowNull": false,
		"defaultValue": null,
		"primaryKey": false
	},
	"id_cart": {
		"type": "INT(10) UNSIGNED",
		"allowNull": false,
		"defaultValue": null,
		"primaryKey": false
	},
	"id_currency": {
		"type": "INT(10) UNSIGNED",
		"allowNull": true,
		"defaultValue": 1,
		"primaryKey": false
	},
	"id_address_delivery": {
		"type": "INT(10) UNSIGNED",
		"allowNull": false,
		"defaultValue": null,
		"primaryKey": false
	},
	"id_address_invoice": {
		"type": "INT(10) UNSIGNED",
		"allowNull": false,
		"defaultValue": null,
		"primaryKey": false
	},
	"current_state": {
		"type": "INT(10) UNSIGNED",
		"allowNull": false,
		"defaultValue": null,
		"primaryKey": false
	},
	"secure_key": {
		"type": "VARCHAR(32)",
		"allowNull": false,
		"defaultValue": "-1",
		"primaryKey": false
	},
	"payment": {
		"type": "VARCHAR(255)",
		"allowNull": true,
		"defaultValue": "Bank Wire",
		"primaryKey": false
	},
	"conversion_rate": {
		"type": "DECIMAL(13,6)",
		"allowNull": false,
		"defaultValue": "1.000000",
		"primaryKey": false
	},
	"module": {
		"type": "VARCHAR(255)",
		"allowNull": true,
		"defaultValue": 'bankwire',
		"primaryKey": false
	},
	"recyclable": {
		"type": "TINYINT(1) UNSIGNED",
		"allowNull": false,
		"defaultValue": "0",
		"primaryKey": false
	},
	"gift": {
		"type": "TINYINT(1) UNSIGNED",
		"allowNull": false,
		"defaultValue": "0",
		"primaryKey": false
	},
	"gift_message": {
		"type": "TEXT",
		"allowNull": true,
		"defaultValue": "",
		"primaryKey": false
	},
	"mobile_theme": {
		"type": "TINYINT(1)",
		"allowNull": false,
		"defaultValue": "0",
		"primaryKey": false
	},
	"shipping_number": {
		"type": "VARCHAR(64)",
		"allowNull": true,
		"defaultValue": "",
		"primaryKey": false
	},
	"total_discounts": {
		"type": "DECIMAL(20,6)",
		"allowNull": false,
		"defaultValue": "0.000000",
		"primaryKey": false
	},
	"total_discounts_tax_incl": {
		"type": "DECIMAL(20,6)",
		"allowNull": false,
		"defaultValue": "0.000000",
		"primaryKey": false
	},
	"total_discounts_tax_excl": {
		"type": "DECIMAL(20,6)",
		"allowNull": false,
		"defaultValue": "0.000000",
		"primaryKey": false
	},
	"total_paid": {
		"type": "DECIMAL(20,6)",
		"allowNull": false,
		"defaultValue": "0.000000",
		"primaryKey": false
	},
	"total_paid_tax_incl": {
		"type": "DECIMAL(20,6)",
		"allowNull": false,
		"defaultValue": "0.000000",
		"primaryKey": false
	},
	"total_paid_tax_excl": {
		"type": "DECIMAL(20,6)",
		"allowNull": false,
		"defaultValue": "0.000000",
		"primaryKey": false
	},
	"total_paid_real": {
		"type": "DECIMAL(20,6)",
		"allowNull": false,
		"defaultValue": "0.000000",
		"primaryKey": false
	},
	"total_products": {
		"type": "DECIMAL(20,6)",
		"allowNull": false,
		"defaultValue": "0.000000",
		"primaryKey": false
	},
	"total_products_wt": {
		"type": "DECIMAL(20,6)",
		"allowNull": false,
		"defaultValue": "0.000000",
		"primaryKey": false
	},
	"total_shipping": {
		"type": "DECIMAL(20,6)",
		"allowNull": false,
		"defaultValue": "0.000000",
		"primaryKey": false
	},
	"total_shipping_tax_incl": {
		"type": "DECIMAL(20,6)",
		"allowNull": false,
		"defaultValue": "0.000000",
		"primaryKey": false
	},
	"total_shipping_tax_excl": {
		"type": "DECIMAL(20,6)",
		"allowNull": false,
		"defaultValue": "0.000000",
		"primaryKey": false
	},
	"carrier_tax_rate": {
		"type": "DECIMAL(10,3)",
		"allowNull": false,
		"defaultValue": "0.000",
		"primaryKey": false
	},
	"total_wrapping": {
		"type": "DECIMAL(20,6)",
		"allowNull": false,
		"defaultValue": "0.000000",
		"primaryKey": false
	},
	"total_wrapping_tax_incl": {
		"type": "DECIMAL(20,6)",
		"allowNull": false,
		"defaultValue": "0.000000",
		"primaryKey": false
	},
	"total_wrapping_tax_excl": {
		"type": "DECIMAL(20,6)",
		"allowNull": false,
		"defaultValue": "0.000000",
		"primaryKey": false
	},
	"round_mode": {
		"type": "TINYINT(1)",
		"allowNull": false,
		"defaultValue": "2",
		"primaryKey": false
	},
	"round_type": {
		"type": "TINYINT(1)",
		"allowNull": false,
		"defaultValue": "2",
		"primaryKey": false
	},
	"invoice_number": {
		"type": "INT(10) UNSIGNED",
		"allowNull": false,
		"defaultValue": "0",
		"primaryKey": false
	},
	"delivery_number": {
		"type": "INT(10) UNSIGNED",
		"allowNull": false,
		"defaultValue": "0",
		"primaryKey": false
	},
	"invoice_date": {
		"type": "DATETIME",
		"allowNull": true,
		"defaultValue": Sequelize.NOW,
		"primaryKey": false
	},
	"delivery_date": {
		"type": "DATETIME",
		"allowNull": true,
		"defaultValue": Sequelize.NOW,
		"primaryKey": false
	},
	"valid": {
		"type": "INT(1) UNSIGNED",
		"allowNull": false,
		"defaultValue": "0",
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
	"id_sypage": {
	    "type": "INT(10) UNSIGNED",
	    "allowNull": true,
	    "defaultValue": null,
	    "primaryKey": false
	}
},{
        tableName:'ps_orders',
        timestamps:true,
        createdAt:'date_add',
        updatedAt:'date_upd',
        deletedAt:false,
        underscored:true,
        scopes:{
            admin:{
                attributes:[
                	'id_order',
                	'id_sypage',
                	'date_add',
                	'date_upd',
                	'reference',
                	'id_customer',
                	'id_address_delivery',
                	'current_state',

					'total_products',
					'total_products_wt',

					'total_discounts',
					'total_discounts_tax_excl',
					'total_discounts_tax_incl',

					'total_shipping',
					'total_shipping_tax_excl',
					'total_shipping_tax_incl',

					'total_paid',
					'total_paid_tax_excl',
					'total_paid_tax_incl',

                	'total_paid_real'
                ]
            },
            admin_include:function(){
            	return {
            		attributes:['id_order','date_add','date_upd','reference','id_customer','id_address_delivery','current_state','total_discounts_tax_incl','total_paid_real','total_shipping_tax_incl'],
            	}
            }
        },
		instanceMethods: {
	      mapAttributes: function(){
	        var obj = new Object(), ctx = this;
	        ctx.attributes.forEach(function(attr){
	         obj[attr] = ctx[attr];
	        });
	        return obj;
	      }
	    },
	    indexes: [
	        {
	          unique: true,
	          fields: ['reference']
	        }
	    ]
    });
}

module.exports.OrderFunc = Order;
