var azurest = require('azure-storage');
var restify = require('restify');
var builder = require('botbuilder');
var azure = require('botbuilder-azure'); 

var tableService = azurest.createTableService('mainbotstorage','aAg3lqYxIsLeVV3nJ67HYWS7ye35OSThcemFar1zpnOvoOs6y5K5g0ZdITNoqwREhNHA58YAhI47Lj/a7cfxvw==');

module.exports = [
    function (session, results) {
        session.dialogData.accion = 'Desbloquear cuenta';
        builder.Prompts.text(session, `¿Cuál es la cuenta que deseas desbloquear? ejemplo: **aperez**`);
    },
    function (session, results) {
        session.dialogData.cuenta = results.response;
        // var random = require('./randomid');
        var x = function myFunc() {
            var y = "";
            var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
            for( var i=0; i < 9; i++ )
            y += possible.charAt(Math.floor(Math.random() * possible.length));
            return y;
            };
            var randomid = x();
            console.log(randomid);

        var table1 = {
            PartitionKey : {'_': session.dialogData.accion, '$':'Edm.String'},
            RowKey: {'_': session.dialogData.cuenta, '$':'Edm.String'},
            RandomId: {'_': randomid, '$':'Edm.String'}
        };
        tableService.insertOrReplaceEntity ('bot2table', table1, function(error) {
        if(!error) {
            console.log('Entity bot2table inserted');   // Entity inserted
        }
        }); 
        var table2 = {
            PartitionKey : {'_': 'Desbloqueo cuenta', '$':'Edm.String'},
            RowKey: {'_': session.dialogData.cuenta, '$':'Edm.String'},
            Status: {'_': 'Noexiste', '$':'Edm.String'}
        };
        tableService.insertOrReplaceEntity ('ps2table', table2, function(error) {
        if(!error) {
            console.log('Entity ps2table inserted');   // Entity inserted
        }
        }); 
        
        if (results.response) {
            // random.id = '';
            // QUERY TABLE ENTITY 
            session.sendTyping();
            setTimeout(() => {
                
                tableService.retrieveEntity('ps2table', 'Desbloqueo cuenta', session.dialogData.cuenta, function(error, result, response) {
                    // var unlock = result.Status._;
                    session.send(session.dialogData.cuenta);
                    if(!error && result.Status._=='Desbloqueado') {
            
                        session.send(`Me solicitaste **Desbloquear tu cuenta**, la cuenta ha sido desbloqueada. Saludos.`);
                            
                    }else if(!error && result.Status._=='Noexiste'){
                
                        session.send(`La cuenta solicitada **No existe**. Saludos.`);
                    }
                    else{
                        session.send("error");
                
                    }
    
                });
            }, 5000);
                // session.endDialog(`Me solicitaste **${session.dialogData.accion}**, tu cuenta es **${session.dialogData.cuenta}**, Saludos.`);
            
           
        }
        else {
            session.endDialog('Adios!');
        }
    }
]