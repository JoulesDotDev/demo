
import { NotesService } from "m3o/notes/index.js"
import express from "express"
import path from "path"

const app = express()
const notesService = new NotesService(process.env.M3O_API_TOKEN)

async function createAnote(title, text) {
  const rsp = await notesService.create({
    title,
    text,
  }).catch(err => console.error(err))
}

let ip = 0

app.get('/ips', async (req, res) => {
  const rsp = await notesService.list({})
  res.send(rsp)
})

app.get('/ip/:id', async (req, res) => {
  const rsp = await notesService.read({
    id: req.params.id,
  })
  res.send(rsp)
})

app.get('/remove/:id', async (req, res) => {
  const rsp = await notesService.delete({
    id: req.params.id,
  })
  res.send(rsp)
})

app.get('*', async (req, res) => {
  await createAnote(`IP: ${++ip}`, req.ip)
  res.sendFile(path.resolve('image.jpg'))
})

app.listen(3000)

