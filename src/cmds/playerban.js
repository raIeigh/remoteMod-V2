const { CryptoJS, axios } = require("../modules")
const { processTask } = require("../functions")

async function altTask(client, _, data) {
    const config = client.config

    const gameID = config.gameID

    const user = data.User
    const duration = data.Duration
    const reason = data.Reason

    const userId = !isNaN(Number(user)) ? Number(user) : await axios.post(`https://users.roblox.com/v1/usernames/users`, {
        usernames: [user],
        excludeBannedUsers: false
    }).then(res => res.data.data[0].id).catch(() => { })
    if (!userId) throw "This player does not exist."

    let username = await axios.get(`https://users.roblox.com/v1/users/${userId}`).then(res => res.data.name).catch(() => { })
    if (!username) throw "This player does not exist."

    let banData = await axios.get(`https://apis.roblox.com/datastores/v1/universes/${gameID}/standard-datastores/datastore/entries/entry?datastoreName=Bans&entryKey=${userId}`, {
        headers: {
            "x-api-key": process.env.ROBLOX_MESSAGE_KEY,
            "content-type": "application/json"
        }
    }).then(res => res.data).catch(() => { })
    if (banData) {
        const duration = banData.Duration
        if (typeof (duration) != "number" || duration > Math.floor(Date.now() / 1000)) throw "Player is already banned."
    }

    banData = {
        Duration: typeof (duration) == "number" ? Math.floor(Date.now() / 1000) + duration : duration,
        Reason: reason
    }
    const banDataMD5 = CryptoJS.enc.Base64.stringify(CryptoJS.MD5(JSON.stringify(banData)))

    await axios.post(`https://apis.roblox.com/datastores/v1/universes/${gameID}/standard-datastores/datastore/entries/entry?datastoreName=Bans&entryKey=${userId}`, banData, {
        headers: {
            "x-api-key": process.env.ROBLOX_MESSAGE_KEY,
            "content-type": "application/json",
            "content-md5": banDataMD5
        }
    }).then(res => res.data).catch(() => { })
    return username
}

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

            if (isNaN(Number(time))) throw "Can't parse duration time."
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
        }, altTask).catch((e) => err = e)

        if (err) throw err
        return `${duration ? "Banned" : "Permbanned"} ${username ? `**${username}** ` : ''}${duration ? `for **${durationMessage}** ` : ''}successfully.`
    }
}