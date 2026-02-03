import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();
const options = {
  method: 'POST',
  url: 'https://api.sms.net.bd/sendsms',
  data: {
    api_key: process.env.SMS_NET_BD,
    msg: 'Test from Node JS',
    to: '8801735429709',
  },
};

axios(options)
  .then((response) => {
    console.log(response.data);
  })
  .catch((error) => {
    console.error(error);
  });
