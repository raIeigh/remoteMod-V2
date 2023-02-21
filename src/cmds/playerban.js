const { processTask } = require("../functions")

module.exports = {
    description: "Bans a player in the game.",
    args: {
        user: {
            description: "The user's name/ID.",
            type: "String",
            required: true
        },
        duration: {
            description: "The duration of the ban. | Units: seconds, minutes, hours, days, weeks, months, years (Ex: 3 days)",
            type: "String",
            required: false
        },
        reason: {
            description: "The reason for moderating the player.",
            type: "String",
            required: false
        }
    },
    async execute(interaction) {
        const client = interaction.client

        const user = interaction.options.getString("user")
        const duration = interaction.options.getString("duration")
        const reason = interaction.options.getString("reason") ?? "You've been banned from the game"

        const units = {
            second: 1,
            minute: 60,
            hour: 60 * 60,
            day: 60 * 60 * 24,
            week: 60 * 60 * 24 * 7,
            month: 60 * 60 * 24 * 30,
            year: 60 * 60 * 24 * 365
        }

        let durationMessage = "Permanent"
        let durationValue = !duration

        if (duration) {
            let [time, unit] = duration.toLowerCase().trim().split(" ").slice(0, 2)

            if (!unit) unit = "seconds"

            if (isNaN(time)) throw "Can't parse duration time."
            else time = Number(time)

            if (!units[unit.replace(/s$/, '')]) throw "Can't parse duration unit."
            else if (unit.match(/s$/) && time == 1) unit = unit.replace(/s$/, '')
            
            durationMessage = `${time} ${unit}`
            durationValue = time * units[unit.replace(/s$/, '')]
        }

        let err
        const username = await processTask(client, "PlayerBan", {
            User: user,
            Duration: durationValue,
            Reason: `${reason} (Duration: ${durationMessage})`
        }).catch((e) => err = e)

        if (err) throw err
        return `${duration ? "Banned" : "Permbanned"} ${username ? `**${username}** ` : ''}${duration ? `for **${durationMessage}** ` : ''}successfully.`
    }
}