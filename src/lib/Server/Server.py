# test_langchain_memory.py
from langchain.memory import ConversationBufferMemory
from langchain_community.llms import Ollama
from langchain.chains import ConversationChain
from langchain.prompts import PromptTemplate

# Initialize the LLM
llm = Ollama(model="mistral")

# Create two separate conversation memories
branch_a_memory = ConversationBufferMemory()
branch_b_memory = ConversationBufferMemory()

# Create conversation templates
template = """
The following is a conversation between a human and an AI assistant.

Current conversation:
{history}
Human: {input}
AI: """

prompt = PromptTemplate(input_variables=["history", "input"], template=template)

# Create two conversation chains with separate memories
branch_a = ConversationChain(
    llm=llm,
    memory=branch_a_memory,
    prompt=prompt,
    verbose=True
)

branch_b = ConversationChain(
    llm=llm,
    memory=branch_b_memory,
    prompt=prompt,
    verbose=True
)

# Test separate contexts
print("\nBranch A - First message:")
response_a1 = branch_a.predict(input="Let's talk about space exploration.")
print(response_a1)
print("\nBranch A Memory Contents:")
print(branch_a_memory.chat_memory.messages)

print("\nBranch B - First message:")
response_b1 = branch_b.predict(input="Tell me about machine learning.")
print(response_b1)
print("\nBranch B Memory Contents:")
print(branch_b_memory.chat_memory.messages)

# Create a new branch inheriting from Branch A
print("\nCreating Branch C from Branch A...")
branch_c_memory = ConversationBufferMemory()
# Copy messages from Branch A to Branch C
for message in branch_a_memory.chat_memory.messages:
    branch_c_memory.chat_memory.add_message(message)

print("\nBranch C Memory Contents (copied from Branch A):")
print(branch_c_memory.chat_memory.messages)

branch_c = ConversationChain(
    llm=llm,
    memory=branch_c_memory,
    prompt=prompt,
    verbose=True
)

print("\nBranch C - First message (with Branch A's context):")
response_c1 = branch_c.predict(input="What about exploring Venus instead?")
print(response_c1)
print("\nBranch C Memory Contents after new message:")
print(branch_c_memory.chat_memory.messages)