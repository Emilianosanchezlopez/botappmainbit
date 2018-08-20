var builder = require('botbuilder');
var nodeoutlook = require('nodejs-nodemailer-outlook');
var azurest = require('azure-storage');
var tableService = azurest.createTableService('mainbotstorage','aAg3lqYxIsLeVV3nJ67HYWS7ye35OSThcemFar1zpnOvoOs6y5K5g0ZdITNoqwREhNHA58YAhI47Lj/a7cfxvw==');

const Client = require('authy-client').Client;
const client = new Client({ key: 'QtNx1BJygMZGbwtXfldWhKivqbTfZ5iW' });

// Registro de usuarios en Authy.
module.exports = [
    function (session) {
        // Se solicita el correo completo del usuario para el registro
        builder.Prompts.text(session, '¿Cuál es tu correo? ejemplo: **gvazquez@mainbit.com.mx**');
    },
    function (session, results) {
        // Se solicita el teléfono celular de 10 dígitos para el registro
        session.dialogData.email = results.response;
        builder.Prompts.text(session, '¿Cuál es tu celular? debe ser de 10 dígitos, ejemplo: 55-1234-5678');
        
    },
    function (session, results) {
        // Se registra al usuario en Authy
        var email = session.dialogData.email;
        console.log(email);        
        
        session.dialogData.celular = results.response;
        client.registerUser({
            countryCode: 'MX',
            email: session.dialogData.email,
            phone: session.dialogData.celular
        },function (err, res) {
            if (err) {
                console.log(`Error al Registrar Usuario`);
            }
            else {
                console.log(`Usuario Registrado:`, res);
                var authyUser = res.user.id;
                var registro = {
                    PartitionKey : {'_': 'Resetear contraseña', '$':'Edm.String'},
                    RowKey: {'_': email , '$':'Edm.String'},
                    AuthyID: {'_': authyUser , '$':'Edm.String'}
                };
                tableService.insertOrReplaceEntity('Authy', registro, function(error) {
                if(!error) {
                    console.log('Entity Authy inserted');   // Entity inserted
                }
                }); 
                nodeoutlook.sendEmail({
                    auth: {
                        user: "esanchezl@mainbit.com.mx",
                        pass: "Kokardo01"
                    }, from: 'esanchezl@mainbit.com.mx',
                    to: `${email}`,
                    subject: 'Código de validación - Servicio de Doble Autenticación',
                    html: `<p>Tu código de seguridad es:<br><h3> <b>${authyUser}</b> </h3> </p><br><p>Saludos.</p>`,
                    text: 'This is text version!',});
            }
        }),
        // Se valida la autenticación del usuario con el código 
        session.send('Enviamos un código de validación a tu correo.');
        builder.Prompts.text(session, 'Por favor, **introduce el código enviado**');
    },
    function (session, results) {
        session.dialogData.token = results.response;
        tableService.retrieveEntity('Authy', 'Resetear contraseña', session.dialogData.email, function(error, result, response) {
            let authyId1 = result.AuthyID._;
            console.log('Id tabla'+authyId1 + typeof(authyId1)) ;
            console.log('Id Proporcionado'+session.dialogData.token+ typeof(session.dialogData.token) ) ;
            if (authyId1 == session.dialogData.token) {
                session.endDialog('Tu cuenta fue registrada correctamente.')
            } else {
                client.deleteUser({ authyId: authyId1 });
                session.endDialog('No pudimos validar el código proporicionado, vuelve a realizar el proceso de registro.');
            }
        });
    }

]