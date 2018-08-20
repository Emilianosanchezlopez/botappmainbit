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
var DialogLabels = {
    Unlock: 'Desbloquear cuenta',
    Reset: 'Resetear contraseña'
};
bot.dialog('/', [
    function (session, results, next) {
        builder.Prompts.choice(session, 'Hola ¿en qué te puedo ayudar?', [DialogLabels.Unlock, DialogLabels.Reset], { listStyle: builder.ListStyle.button });
    },
    function (session, result) {
             // continue on proper dialog
        var selection = result.response.entity;
        switch (selection) {
            case DialogLabels.Unlock:
                return session.beginDialog('desbloqueo');
            case DialogLabels.Reset:
                return session.beginDialog('existe');
        }
    }
]);
bot.dialog('desbloqueo', require('./desbloqueo'));
bot.dialog('reseteo', require('./reseteo'));
bot.dialog('existe', require('./existe'));
bot.dialog('registro', require('./registro'));