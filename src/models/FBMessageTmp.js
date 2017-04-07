module.exports.FBMessageTmpFunc = function(Sequelize,sequelize){
    return sequelize.define('FBMessageTmp',{  
       "id":{  
          "type":"INT(11)",
          "allowNull":false,
          "defaultValue":null,
          "primaryKey":true,
          autoIncrement:true
       },
       "pid":{  
          "type":"BIGINT(20)",
          "allowNull":false,
          "defaultValue":null,
          "primaryKey":false
       },
       "puid":{  
          "type":"BIGINT(20)",
          "allowNull":false,
          "defaultValue":null,
          "primaryKey":false
       },
       "tid":{  
          "type":"VARCHAR(40)",
          "allowNull":false,
          "defaultValue":null,
          "primaryKey":false
       },
       "mid":{  
          "type":"VARCHAR(40)",
          "allowNull":false,
          "defaultValue":null,
          "primaryKey":false
       }
    },{
        tableName:'fb_message_tmp',
        timestamps:true,
        createdAt:false,
        updatedAt:false,
        deletedAt:false,
        underscored:true,
        scopes:{}
    });

}