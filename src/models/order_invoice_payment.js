module.exports.OrderInvoicePaymentFunc = function(Sequelize,sequelize){
    return sequelize.define('OrderInvoicePayment',
    {
        "id_order_invoice": {
            "type": "INT(11) UNSIGNED",
            "allowNull": false,
            "defaultValue": null,
            "primaryKey": true
        },
        "id_order_payment": {
            "type": "INT(11) UNSIGNED",
            "allowNull": false,
            "defaultValue": null,
            "primaryKey": true
        },
        "id_order": {
            "type": "INT(11) UNSIGNED",
            "allowNull": false,
            "defaultValue": null,
            "primaryKey": false
        }
    },{
        tableName:'ps_order_invoice_payment',
        timestamps:false,
        createdAt:false,
        updatedAt:false,
        deletedAt:false,
        underscored:true,
        scopes:{
            admin:{
                attributes:['id_order_invoice','id_order_payment','id_order']
            }
        }
    });

}