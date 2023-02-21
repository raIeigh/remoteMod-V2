const { processTask } = require("../functions")

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

        const user = interaction.options.getString("user")
        const reason = interaction.options.getString("reason") ?? "You've been kicked from the game"

        let err
        const response = await processTask(client, "PlayerKick", {
            User: user,
            Reason: reason
        }).catch((e) => err = e)
        
        if (err) throw err
        return response ?? "Kicked successfully."
    }
}