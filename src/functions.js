const { Discord, fs, path, axios } = require("./modules")

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
    var charset = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_"
    var id = ""

    for (var i = 0; i < length; i++) {
        id += charset[Math.floor(Math.random() * charset.length)]
    }

    return id
}

functions.getCommands = function () {
    const { SlashCommandBuilder } = Discord

    const commands = fs.readdirSync("src/cmds").map((cmd) => {
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

functions.processTask = async function (client, topic, data, altTask) {
    let tasks = client.tasks
    const config = client.config

    const gameID = config.gameID
    const placeID = config.placeID
    const timeoutMS = config.timeoutMS

    const serversNum = await axios.get(`https://games.roblox.com/v1/games/${placeID}/servers/0`).then(res => res.data.data.length).catch(() => { })

    if (!serversNum) {
        if (altTask) {
            let err
            const altTaskResponse = altTask && await altTask(client, topic, data).catch((e) => err = e)

            if (err) throw err
            return altTaskResponse
        }
        
        throw "There's no active servers, I can't do that."
    }

    const taskID = functions.generateID()
    data.TaskURL = `${process.env.WEBSITE_URL}/tasks/${taskID}`

    let task = { topic, data, processed: false }
    tasks[taskID] = task

    const response = await new Promise(async (resolve, reject) => {
        task.completion = { resolve, reject }

        console.log(data)

        setTimeout(() => {
            if (!task.processed) reject("Task timed out.")
        }, timeoutMS)

        let err
        await axios.post(`https://apis.roblox.com/messaging-service/v1/universes/${gameID}/topics/${topic}`, {
            message: JSON.stringify(data)
        }, {
            headers: {
                "x-api-key": process.env.ROBLOX_MESSAGE_KEY,
                "content-type": "application/json"
            }
        }).catch((e) => {
            if (e.response && e.response.data)
                err = e.response.data
            else
                err = e.message
        })

        if (err) return reject(err)
    }).catch(e => err = e)

    task.processed = true
    delete tasks[taskID]

    if (err) throw err
    return response
}

module.exports = functions