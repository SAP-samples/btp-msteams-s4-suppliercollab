import botbuilder from 'botbuilder';

const adapter = new botbuilder.BotFrameworkAdapter({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});

const onTurnError = async (context, error) => {

    console.error(`\n [onTurnError] unhandled error: ${error}`)
    await context.sendActivity('The  bot encountered an error or bug');
    await context.sendActivity('To continue to run this bot, please fix the bot source code.')
}

adapter.onTurnError = onTurnError

export default adapter