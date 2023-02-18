const { axios } = require('../modules')
const { generateID } = require('../functions')

module.exports = {
    description: 'Kicks a player in the game.',
    args: {
        userid: {
            type: 'Integer',
            required: true
        }
    },
    async execute(interaction) {
        const client = interaction.client
        const gameID = client.config.gameID

        let err
        const response = await axios.post(`https://apis.roblox.com/messaging-service/v1/universes/${gameID}/topics/Kick`, {
            message: {
                UserID: interaction.options.getInteger('userid'),
                JobURL: generateID()
            }
        }, {
            headers: {
                'x-api-key': process.env.MESSAGING_KEY,
                'Content-Type': 'application/json'
            }
        }).catch((e) => err = e.message)

        if (!response) throw err

        return response ? 'We did it.' : 'Oh no.'
    }
}