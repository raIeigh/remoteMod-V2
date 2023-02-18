const { Discord } = require('./src/modules')
const { getCommands, findCommand, updateCommands, requireJSON } = require('./src/functions')

const { Client, REST } = Discord

const client = new Client({
    intents: 3243773
})
client.rest = new REST({
    version: '10'
})
client.commands = getCommands()
client.config = requireJSON('config.json')

client.on('interactionCreate', async (interaction) => {
    const commandName = interaction.commandName
    const command = findCommand(client, commandName)
    if (!command) return await interaction.reply('No.').catch(() => { })

    const execute = command.execute

    let err
    const response = await execute(interaction).catch(e => err = e)
    if (err) return await interaction.reply(err.message ?? err).catch(() => { })

    await interaction.reply(response).catch(() => { })
})

client.on('ready', () => {
    updateCommands(client)
    console.log('poopert')
})

client.login(process.env.REMOTEMOD_KEY)