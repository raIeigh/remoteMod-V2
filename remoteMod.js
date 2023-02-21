const { Discord, axios } = require("./src/modules")
const { getCommands, findCommand, updateCommands, requireJSON } = require("./src/functions")

const { Client, REST } = Discord

const client = new Client({
    intents: 3243773
})
client.rest = new REST({
    version: "10"
})
client.commands = getCommands()
client.config = requireJSON("config.json")
client.tasks = {}

client.on("interactionCreate", async (interaction) => {
    const commandName = interaction.commandName
    const command = findCommand(client, commandName)
    if (!command) return await interaction.reply("No.").catch(() => { })

    const execute = command.execute

    if (!command.noDefer) await interaction.deferReply().catch(() => { })

    let err
    const response = await execute(interaction).catch(e => err = e)
    if (err) return await interaction.editReply(err.message ?? err).catch(() => { })

    await interaction.editReply(response).catch(() => { })
})

module.exports = async function (token) {
    await client.login(token)
    console.log(`${client.user.username}'s up`)

    updateCommands(client)
    const placeID = await axios.get(`https://develop.roblox.com/v1/universes/${client.config.gameID}/places?sortOrder=Asc&limit=10`).then(res => res.data.data[0].id).catch(() => { })
    if (placeID) client.config.placeID = placeID
    
    return client
}