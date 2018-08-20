var azurest = require('azure-storage');
var builder = require('botbuilder');
const Client = require('authy-client').Client;
const client = new Client({ key: 'QtNx1BJygMZGbwtXfldWhKivqbTfZ5iW' });
var tableService = azurest.createTableService('mainbotstorage','aAg3lqYxIsLeVV3nJ67HYWS7ye35OSThcemFar1zpnOvoOs6y5K5g0ZdITNoqwREhNHA58YAhI47Lj/a7cfxvw==');

module.exports = [
function (session, results) {
    session.dialogData.accion = 'Resetear contraseña';
    builder.Prompts.text(session, `¿Cuál es tu cuenta? ejemplo: **aperez@mainbit.com.mx**`);
},
function (session, results) {
    session.dialogData.cuenta = results.response.toLowerCase();
    console.log(session.dialogData.cuenta);
    
    tableService.retrieveEntity('Authy', session.dialogData.accion, session.dialogData.cuenta, function(error, result, response) {
        let authyId1 = result.AuthyID._;
            // Enviar SMS
            console.log('El id del usuario es: '+authyId1);
            client.requestSms({ authyId: authyId1 }, function (err, res) {
                });  
    });
    builder.Prompts.text(session, 'Te enviamos un código SMS a tu celular **¿Cuál es el código?**')
},
function (session, results) {
    session.dialogData.token1 = results.response;
    var token2 = session.dialogData.token1;
    console.log('Token es: '+ typeof(token2))
    // session.send('Espera mientras validamos la operación...');
    tableService.retrieveEntity('Authy', session.dialogData.accion, session.dialogData.cuenta, function(error, result, response) {
        let authyId1 = result.AuthyID._;
            console.log(authyId1)  
            client.verifyToken({ authyId: authyId1, token: token2 })
                .then(function(response) {
                    var x = function myFunc() {
                        var y = "";
                        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
                        for( var i=0; i < 9; i++ )
                        y += possible.charAt(Math.floor(Math.random() * possible.length));
                        return y;
                        };
                        var randomid = x();
                        console.log(randomid);
            
                    var newPass = {
                        PartitionKey : {'_': session.dialogData.accion, '$':'Edm.String'},
                        RowKey: {'_': session.dialogData.cuenta, '$':'Edm.String'},
                        RandomId: {'_': randomid, '$':'Edm.String'}
                    };
                    tableService.insertOrReplaceEntity ('bot2table', newPass, function(error) {
                    if(!error) {
                        console.log('Entity bot2table inserted');   // Entity inserted
                    }}); 
                    console.log('Token is valid');
                    session.send(`Tu cuenta ha cambiado de password, ahora es: **${randomid}**.`);
                    session.endDialog(`Recuerda que si estás en la red interna de Mainbit debes esperar 1 minuto antes de validar tu acceso, en caso de estar fuera de la red interna este proceso puede tardar hasta 10 minutos.`);
                })
                .catch(function(error) {
                    throw error;
                    session.endDialog('El código proporcionado es incorrecto.');
            });
    });
}
]