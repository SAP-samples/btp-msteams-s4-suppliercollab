import "dotenv/config";
import path from 'path'
import cors from 'cors'
import { fileURLToPath } from 'url';
import express from "express";
import adapter from "./server/bots/botAdapter.js";
import botActivityHandler from "./server/bots/BotActivityHandler.js"
import { getEventPOCard }
  from "./server/bots/utils/BotRequestHelper.js";
import s4Router from "./server/api/s4Router.js"
// imports which rely on env
import {teamsFilter} from './server/filters/teamsFilter.js'
import bodyParser from 'body-parser';
import { MessageFactory,TeamsInfo } from 'botbuilder'

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PORT = process.env.PORT || 3333;
const server = express();
server.use(bodyParser.json());
server.use(cors());
server.use(express.static(path.resolve(__dirname, './client/build')))

server.get("/", async (req, res) => {
    res.send({ message: "BTP S4 MSTeams SupplierCollab is looks good" });
  });

server.post('/api/messages', async (req, res) => {
    await adapter.process(req, res,
        async (context) => await botActivityHandler.run(context)
      );
  });

server.get('/api/getMeetingDataByChatId/:chatId', async (req, res) => {
  const chatId = req.params.chatId;
  try{
    const meetingData = await botActivityHandler.getMeetingDataByChatId(chatId);
    res.status(200).send(meetingData);
    } catch(err){
        res.status(500).send("Error occured");
    }
});

server.post('/em/po-attention', async(req, res) => {
  if(req.body && Object.keys(req.body).length != 0){
    //const prId = req.body.NUMBER;
    //const wfId = req.body.WI_ID;
    const MAIL_ID = req.body.mailid;
    for (const conversationReference of Object.values(botActivityHandler.conversationReferences)) {
      await adapter.continueConversation(conversationReference, async turnContext => {
        const userEmail = await getSingleMember(turnContext)
        console.log("email Id :"+userEmail.email)
        if(userEmail.email === MAIL_ID){
          const payload = req.body.poDetails;
          const card = await getEventPOCard(payload)
          await turnContext.sendActivity(MessageFactory.attachment(card));
        } 
      });
    }
  }
   res.status(200).send();
})

async function getSingleMember(context) {
  try {
      const member = await TeamsInfo.getMember(
          context,
          context.activity.from.id
      );
      return member;
  } catch (e) {
      if (e.code === 'MemberNotFoundInConversation') {
          return context.sendActivity(MessageFactory.text('Member not found.'));
      } else {
          throw e;
      }
  }
}

// endpoints secured by teams token
//server.use('/api', teamsFilter.auth(), apiRouter)
server.use('/api/s4', teamsFilter.auth(), s4Router)

// static web files
// not secured as only static web content provided
server.get('*', (req, res) => {
  console.log(req)
  res.sendFile(path.resolve(__dirname, './client/build', 'index.html'))
})

server.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
});