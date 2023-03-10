async function main() {
    const { express, cors, bp, axios } = require("./src/modules")
    const remoteMod = require("./remoteMod")

    const client = await remoteMod(process.env.DISCORD_BOT_TOKEN)
    const PORT = process.env.PORT || 8080
    const app = express()

    if (!process.env.WEBSITE_URL) process.env.WEBSITE_URL = process.env.RAILWAY_STATIC_URL ? `https://${process.env.RAILWAY_STATIC_URL}` : `http://localhost:${PORT}`

    app.use(cors())
    app.use(bp.json())
    app.use(bp.urlencoded({ extended: true }))

    app.route("/tasks/:taskID")
        .get((req, res) => {
            const taskID = req.params.taskID

            let tasks = client.tasks
            const task = tasks[taskID]

            res.type("json")
            res.send(task ?? {})
        })
        .post((req, res) => {
            const taskID = req.params.taskID
            const success = !!req.body.success
            const response = req.body.response

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
            complete(response)

            res.send({ success: true })
        })

    app.listen(PORT, () => console.log("Website is up"))

    setInterval(function () {
        axios.get(process.env.WEBSITE_URL).catch(() => { })
    }, 300000)
}

main()