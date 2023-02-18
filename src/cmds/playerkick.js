const { axios } = require("../modules")
const { generateID } = require("../functions")

module.exports = {
    description: "Kicks a player in the game.",
    args: {
        user: {
            description: "The user's name/ID.",
            type: "String",
            required: true
        },
        reason: {
            description: "The reason for kicking the player.",
            type: "String",
            required: false
        }
    },
    async execute(interaction) {
        const client = interaction.client
        const gameID = client.config.gameID

        const user = interaction.options.getString("user")
        const reason = interaction.options.getString("reason") ?? "You've been kicked from the game"

        let err
        const response = await axios.post(`https://apis.roblox.com/messaging-service/v1/universes/${gameID}/topics/PlayerKick`, {
            message: JSON.stringify({
                User: user,
                Reason: reason,
                JobURL: generateID()
            })
        }, {
            headers: {
                "x-api-key": process.env.MESSAGING_KEY,
                "Content-Type": "application/json"
            }
        }).catch((e) => err = e.message)

        if (err) throw err

        return response ? "We did it." : "Oh no."
    }
}