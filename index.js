import OpenAI from 'openai'
import line from '@line/bot-sdk'
import express from 'express'

// line config
const lineConfig = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET
}

function init () {
  const app = express()

  // root test
  app.get('/', (req, res) => {
    res.send('OpenAI Line Chatbot')
  })

  // line webhook
  app.post('/webhook', line.middleware(lineConfig), (req, res) => {
    Promise
      .all(req.body.events.map(lineEventHandler))
      .then((result) => res.json(result))
  })

  // openai api test
  app.get('/bot_test', async (req, res) => {
    const q = req.query?.q
    const result = await askOpenAI(q || '你好，請問您的大名是？')
    res.send(result)
  })

  app.listen(3388)
}

async function lineEventHandler (event) {
  const lineClient = new line.Client(lineConfig)

  // if (event.type !== 'message' || event.message.type !== 'text' || !event.message.text.includes('村長')) {
  if (event.type !== 'message' || event.message.type !== 'text') {
    return Promise.resolve(null)
  }

  const result = await askOpenAI(event.message.text)

  return lineClient.replyMessage(event.replyToken, {
    type: 'text',
    text: result
  })
}

async function askOpenAI (question) {
  // request
  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    // const completion = await openai.chat.completions.create({
    //   model: 'gpt-4',
    //   messages: [{ role: 'user', content: question }]
    // })

    const completion = await openai.chat.completions.create({
      model: 'ft:gpt-3.5-turbo-1106:personal::8TQwZNGO',
      messages: [{ role: 'user', content: question }]
    })

    return completion.choices[0].message.content.replace(/^\n+/g, '')
  } catch (err) {
    console.log(err)
    // res.status(200).json({ result: '抱歉我不知道' })
    return '抱歉我不知道'
  }
}

init()
