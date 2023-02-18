const { Discord, fs, path } = require('./modules')

let functions = {}

functions.capitalize = function (str) {
    return str.substring(0, 1).toUpperCase() + str.substring(1).toLowerCase()
}

functions.argAddText = function (type) {
    return `add${type}Option`
}

functions.argGetText = function (type) {
    return `get${type}`
}

functions.requireJSON = function (path) {
    return JSON.parse(fs.readFileSync(path).toString())
}

functions.generateID = function (length = 10) {
    var charset = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_'
    var id = ''

    for (var i = 0; i < length; i++) {
        id += charset[Math.floor(Math.random() * charset.length)]
    }

    return id
}

functions.getCommands = function () {
    const { SlashCommandBuilder } = Discord

    const commands = fs.readdirSync('src/cmds').map((cmd) => {
        let command = require(`./cmds/${cmd}`)
        command.name = path.parse(cmd).name
        command.args = command.args ?? []

        return command
    })

    return commands.map((command) => {
        const builder = new SlashCommandBuilder()
            .setName(command.name)
            .setDescription(command.description)

        for (const name in command.args) {
            const arg = command.args[name]
            const addOption = functions.argAddText(arg.type)

            builder[addOption]((option) =>
                option.setName(name)
                      .setDescription(arg.description)
                      .setRequired(!!arg.required)
            )
        }

        command.builder = builder
        return command
    })
}

functions.findCommand = function (client, command) {
    return client.commands.find(cmd => cmd.name == command)
}

functions.updateCommands = function (client) {
    const { Routes } = Discord
    const rest = client.rest

    const commandBuilders = client.commands.map(command => command.builder)

    rest.put(Routes.applicationCommands(client.user.id), { body: commandBuilders }).catch((err) => console.log(err))
}

module.exports = functions