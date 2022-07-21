import { Router } from 'express'
import { fetchpodetails, fetchpoitemdetails, createpoconfirmdetails, updatepoconfirmdetails, deletepoconfirmdetails } from '../services/S4Client.js';

const s4Router = Router();

s4Router.get('/fetchpodetails/:poId',fetchpodetails);
s4Router.get('/fetchpoitemdetails/:poId/:itemId',fetchpoitemdetails);
s4Router.post('/createpoconfirmdetails',createpoconfirmdetails);
s4Router.put('/updatepoconfirmdetails/:poId/:itemId/:seqNo',updatepoconfirmdetails);
s4Router.delete('/deletepoconfirmdetails/:poId/:itemId/:seqNo',deletepoconfirmdetails);

export default s4Router

