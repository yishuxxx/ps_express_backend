module.exports.OrderFunc = function(Sequelize,sequelize){
    return sequelize.define('Order',,{
        tableName:'ps_orders',
        timestamps:true,
        createdAt:'date_add',
        updatedAt:'date_upd',
        deletedAt:false,
        underscored:true,
        scopes:{
            admin:{
                attributes:['id_order']
            }
        }
    });

}