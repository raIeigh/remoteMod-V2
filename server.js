const { express, cors, bp } = require("./src/modules")
const startBot = require('./startBot')

if (process.env.RAILWAY_STATIC_URL && !process.env.BOT_WEBSITE) process.env.BOT_WEBSITE = `https://${process.env.RAILWAY_STATIC_URL}`

app.use(cors())
app.use(bp.json())
app.use(bp.urlencoded({ extended: true }))

startBot(process.env.DISCORD_BOT_TOKEN)