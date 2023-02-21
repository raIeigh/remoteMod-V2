async function main() {
    const { express, cors, bp, axios } = require("./src/modules")
    const remoteMod = require("./remoteMod")

    const client = await remoteMod(process.env.DISCORD_BOT_TOKEN)
    const PORT = process.env.PORT || 8080
    const app = express()

    if (!process.env.WEBSITE_URL) process.env.WEBSITE_URL = process.env.RAILWAY_STATIC_URL ? `https://${process.env.RAILWAY_STATIC_URL}` : "http://localhost:8080"

    app.use(cors())
    app.use(bp.json())
    app.use(bp.urlencoded({ extended: true }))

    app.post("/tasks/:taskID", (req, res) => {
        const taskID = req.params.taskID
        const success = !!req.body.success
        const reason = req.body.reason

        let tasks = client.tasks
        const task = tasks[taskID]

        res.type("json")

        if (!task || task.processed) {
            const errReason = !task && "Task does not exist." ||
                task.processed && "Task was already processed."

            res.status(400)
            return res.send({ success: false, reason: errReason })
        }

        const complete = task.completion[success ? "resolve" : "reject"]
        complete(reason)
        delete tasks[taskID]

        res.send({ success: true })
    })

    app.listen(PORT, () => console.log("Website is up"))

    setInterval(function () {
        axios.get(process.env.WEBSITE_URL).catch(() => { })
    }, 300000)
}

main()