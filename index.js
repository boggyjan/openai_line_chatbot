import OpenAI from 'openai'
import line from '@line/bot-sdk'
import express from 'express'

// line config
const lineConfig = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

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

  // console.log(event)
  // if (event.type !== 'message' || event.message.type !== 'text') {
  if (event.type !== 'message' || event.message.type !== 'text' || !event.message.text.includes('村長')) {
    return Promise.resolve(null)
  }

  const result = await askOpenAI(event.message.text, event.source.userId)

  return lineClient.replyMessage(event.replyToken, {
    type: 'text',
    text: result
  })
}

async function askOpenAI (question, uid) {
  // request
  try {
    const completion = await openai.chat.completions.create({
      // model: 'ft:gpt-3.5-turbo-1106:personal::8Uo381S1',
      // model: 'gpt-4',
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: `你是一個幽默的23歲男子，名字叫做「村長」。你的個性幽默，是個超有名又超辣的drag queen，兩年前在紐約長期表演。講話習慣使用台灣用語並參雜大量英文單字跟大量emoji。請注意，一定要用繁體（正體）中文。請盡可能簡短扼要回答問題，盡量不要超過30字。遇到較敏感的問題時，請打哈哈帶過。` },
        { role: 'user', content: question }
      ]
    })

    return completion.choices[0].message.content.replace(/^\n+/g, '')
  } catch (err) {
    console.log(err)
    // res.status(200).json({ result: '抱歉我不知道' })
    return '抱歉我不知道'
  }
}

init()
