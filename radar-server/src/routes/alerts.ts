import { Hono } from "hono"
const app = new Hono()
app.get("/", (c) => c.json({ data: null, error: { message: "Not implemented", code: "NOT_IMPLEMENTED" } }))
export default app
