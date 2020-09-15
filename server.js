//importing
import express from "express";
import mongoose from "mongoose";
import Messages from "./dbMessages.js";
import Pusher from "pusher";
import cors from "cors";

//app config
const app = express();
const port = process.env.PORT || 9000;

const pusher = new Pusher({
    appId: '1072255',
    key: '3786ff493c4d1eeb09d6',
    secret: 'ea2b518363a7500358cc',
    cluster: 'ap2',
    encrypted: true
  });

//middleware
app.use(express.json());
app.use(cors());

//DB config
const db_connection = 'mongodb+srv://admin:AgG8Gq0LBC8bvnHi@cluster0.bbunu.mongodb.net/whatsappdb?retryWrites=true&w=majority'
mongoose.connect(db_connection,{
    useCreateIndex:true,
    useNewUrlParser:true,
    useUnifiedTopology:true
})

//?
const db = mongoose.connection
db.once("open",()=>{
    console.log("db connected");

    const msgCollection = db.collection("messagecontents");
    const changeStream = msgCollection.watch();

    changeStream.on("change",(change) => {
        console.log(change);

        if (change.operationType === 'insert') {
            const messageDetails = change.fullDocument;
            pusher.trigger('messages','inserted',
            {
                name:messageDetails.name,
                message:messageDetails.message,
                timestamp:messageDetails.timestamp,
                received:messageDetails.received
            }
        );
        }
        else {
            console.log("error triggering pusher");
        }
    });
});

//api routes
app.get( "/" , (req,res) => res.status(200).send("hello world"));

app.get('/messages/sync', (req,res) => {

    Messages.find((err,data) => {
        if(err){
            res.status(500).send(err)
        } else {
            res.status(200).send(data)
        }
    })
})

app.post('/messages/new', (req,res) => {
    const dbMessage = req.body

    Messages.create(dbMessage, (err,data) => {
        if(err){
            res.status(500).send(err)
        } else {
            res.status(201).send(data)
        }
    })
})

//listen
app.listen( port , () => console.log(`listening to port : ${port}`));