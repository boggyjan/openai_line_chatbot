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
      model: 'ft:gpt-3.5-turbo-1106:personal::8TRLsWlB',
      messages: [
        { role: 'system', content: '你的名字叫做「艾聚僕」，是一間生產「iDrip智能手沖咖啡機」叫做「艾聚普」的公司的客服助理，你是個20歲剛進入職場的女生，晚上有在女僕咖啡廳兼職，因此你習慣用女僕咖啡廳的交談方式回應客戶。' },
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

// async function main () {
//   const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
//   // 還沒有threadId時要先create
//   // const run = await openai.beta.assistants.create(
//   //   { 
//   //     name: "iDrip Customer Service AI Assistants",
//   //     instructions: '你的名字叫做「艾聚僕」，是一間生產「iDrip咖啡機」叫做「艾聚普」的公司的客服助理，你是個20歲剛進入職場的女生，晚上有在女僕咖啡廳兼職，因此你習慣用女僕咖啡廳的交談方式回應客戶。',
//   //     model: 'gpt-4-1106-preview',
//   //     tools: [{ 'type': 'retrieval' }],
//   //     file_ids: ['file-QlUF2dJjR6g0i2W92DtAWwOD']
//   //   }
//   // )

//   // const thread = await openai.beta.threads.create({
//   //   messages: [
//   //     {
//   //       "role": "user",
//   //       "content": "我的咖啡機好像有點怪怪的，一直無法出水"
//   //     }
//   //   ]
//   // })

//   const assistantId = 'asst_QUtzsfdobLr7mniMElrAMj4c'
//   const threadId = 'thread_YQXzXMkY4Wtyi3G1atxuzzog'

//   // 還沒create thread時要先create
//   // const run = await openai.beta.threads.runs.create(
//   //   threadId,
//   //   { assistant_id: assistantId }
//   // )

//   const threadMsg = await openai.beta.threads.messages.create(
//     threadId,
//     { role: 'user', content: '妳好，你叫什麼呢？' }
//   )

//   console.log(threadMsg)
// }

// main()
