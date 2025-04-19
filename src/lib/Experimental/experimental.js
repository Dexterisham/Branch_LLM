import express from "express";
import cors from "cors";

const app=express();
app.use(express.json());
app.use(cors());

app.get("/",(req,res)=>{
    res.json({message:"hello world!"})
})

app.post("/chat",(req,res)=>{
const message=req.body.message || "No message provided";
console.log("recieved messag:",message);

const response='you said: ${message}';
res.json({response});
});

const PORT=3002;
app.listen(PORT,()=>{
    console.log(`server is running on port ${PORT}`);
});