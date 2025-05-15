import express from 'express';
import cors from 'cors';
import { ChatOllama } from "@langchain/community/chat_models/ollama";
import { BufferMemory } from "langchain/memory";
import { ConversationChain } from "langchain/chains";

const app=express();

app.use(cors());
app.use(express.json());


let memory = new BufferMemory({
returnMessages=true,
memoryKey:'chatHistory'

})
 let model ="mistral"

 let llm= new ChatOllama({

  model: model,
  baseUrl:"https://localhost:11434"
 })

 let chain= new ConversationChain({

  llm,
  memory,
  verbose=true
 });