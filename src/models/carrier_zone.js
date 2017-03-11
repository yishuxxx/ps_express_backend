module.exports.CarrierZoneFunc = function(Sequelize,sequelize){
    return sequelize.define('CarrierZone',{
        "id_carrier": {
            "type": "INT(10) UNSIGNED",
            "allowNull": false,
            "defaultValue": null,
            "primaryKey": true
        },
        "id_zone": {
            "type": "INT(10) UNSIGNED",
            "allowNull": false,
            "defaultValue": null,
            "primaryKey": true
        }
    },{
        tableName:'ps_carrier_zone',
        timestamps:false,
        createdAt:false,
        updatedAt:false,
        deletedAt:false,
        underscored:true,
        scopes:{
            admin:{
                attributes:[
                'id_carrier',
                'id_zone'
                ]
            }
        }
    });

}