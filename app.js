/*-----------------------------------------------------------------------------
A simple echo bot for the Microsoft Bot Framework. 
-----------------------------------------------------------------------------*/
var azurest = require('azure-storage');
var restify = require('restify');
var builder = require('botbuilder');
var botbuilder_azure = require("botbuilder-azure");

// Create table service for Azure Storage Bot
var tableService = azurest.createTableService('mainbotstorage','aAg3lqYxIsLeVV3nJ67HYWS7ye35OSThcemFar1zpnOvoOs6y5K5g0ZdITNoqwREhNHA58YAhI47Lj/a7cfxvw==');

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url); 
});
  
// Create chat connector for communicating with the Bot Framework Service
var connector = new builder.ChatConnector({
    appId: process.env.MicrosoftAppId,
    appPassword: process.env.MicrosoftAppPassword,
    openIdMetadata: process.env.BotOpenIdMetadata 
});

// Listen for messages from users 
server.post('/api/messages', connector.listen());

/*----------------------------------------------------------------------------------------
* Bot Storage: This is a great spot to register the private state storage for your bot. 
* We provide adapters for Azure Table, CosmosDb, SQL Azure, or you can implement your own!
* For samples and documentation, see: https://github.com/Microsoft/BotBuilder-Azure
* ---------------------------------------------------------------------------------------- */

var tableName = 'botdata';
var azureTableClient = new botbuilder_azure.AzureTableClient(tableName, process.env['AzureWebJobsStorage']);
var tableStorage = new botbuilder_azure.AzureBotStorage({ gzipData: false }, azureTableClient);

// Create your bot with a function to receive messages from the user
var bot = new builder.UniversalBot(connector);
bot.set('storage', tableStorage);

// Dialogos
bot.dialog('/', [
    function (session, results, next) {
        builder.Prompts.choice(session, 'Hola ¿en qué te puedo ayudar?', 'Desbloquear cuenta|Resetear contraseña', { listStyle: builder.ListStyle.button });
    },
    function (session, results) {
        session.dialogData.accion = results.response.entity;
        builder.Prompts.text(session, `¿Cuál es tu cuenta? ejemplo: **aperez**`);
    },
    function (session, results) {
        session.dialogData.cuenta = results.response;
        builder.Prompts.confirm(session, '¿Quieres ver un resumen?', { listStyle: builder.ListStyle.button });
    },
    function (session, results) {
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
        tableService.insertEntity('bot2table', table1, function(error) {
        if(!error) {
            console.log('Entity bot2table inserted');   // Entity inserted
        }
        }); 
        var table2 = {
            PartitionKey : {'_': session.dialogData.accion, '$':'Edm.String'},
            RowKey: {'_': session.dialogData.cuenta, '$':'Edm.String'},
            RandomId: {'_': randomid, '$':'Edm.String'}
        };
        tableService.insertEntity('ps2table', table2, function(error) {
        if(!error) {
            console.log('Entity ps2table inserted');   // Entity inserted
        }
        }); 
        
        if (results.response) {
            // random.id = '';
            // QUERY TABLE ENTITY 
            tableService.retrieveEntity('ps2table', session.dialogData.accion, session.dialogData.cuenta, function(error, serverEntity) {
            if(!error) {
            console.log(serverEntity.PartitionKey);  // Entity available in serverEntity variable
            }
            });
            session.sendTyping();
            setTimeout(function () {
                // session.send("Hello there...");
                session.endDialog(`Me solicitaste **${session.dialogData.accion}**, tu cuenta es **${session.dialogData.cuenta}**, Saludos.`);
            }, 3000);
        }
        else {
            session.endDialog('Adios!');
        }
    }
]);