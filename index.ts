import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';


dotenv.config();

const app = express();
const PORT = process.env.PORT 

app.use(cors());
app.use(express.json());

app.get('/', (req: Request, res: Response) => {
  res.send('Hello World!');
});

// কমেন্ট করে রাখা MongoDB ও Jose-CJS (TypeScript-এ এভাবে ইম্পোর্ট করতে হবে)
// import { MongoClient, ServerApiVersion, ObjectId } from 'mongodb';
// import { createRemoteJWKSet, jwtVerify } from 'jose-cjs';


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});