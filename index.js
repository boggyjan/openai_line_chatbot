const { Configuration, OpenAIApi } = require('openai')
const line = require('@line/bot-sdk')
const express = require('express')

// line config
const config = {
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
  app.post('/webhook', line.middleware(config), (req, res) => {
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
  const lineClient = new line.Client(config)

  if (event.type !== 'message' || event.message.type !== 'text' || !event.message.text.includes('村長')) {
    return Promise.resolve(null)
  }

  const result = await askOpenAI(event.message.text)

  return lineClient.replyMessage(event.replyToken, {
    type: 'text',
    text: result
  })
}

async function askOpenAI (question) {
  // opan ai config
  const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  })
  const openai = new OpenAIApi(configuration)

  // request
  try {
    const completion = await openai.createCompletion({
      model: 'text-davinci-003',
      max_tokens: 100,
      prompt: question,
      temperature: 0.1,
    })

    // res.status(200).json({ result: completion.data.choices[0].text })
    return completion.data.choices[0].text.replace(/^\n+/g, '')
  } catch (err) {
    // console.log(err)
    // res.status(200).json({ result: '抱歉我不知道' })
    return '抱歉我不知道'
  }
}

init()
