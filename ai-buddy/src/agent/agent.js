const { StateGraph, MessagesAnnotation } = require("@langchain/langgraph")
const { ChatGoogleGenerativeAI } = require("@langchain/google-genai")
const { ToolMessage, AIMessage, SystemMessage } = require("@langchain/core/messages")
const tools = require("./tools")    


const model = new ChatGoogleGenerativeAI({
    model: "models/gemini-2.5-flash",
    temperature: 0.5,
})

const AGENT_SYSTEM_PROMPT = new SystemMessage({
    content: "You are an e-commerce assistant. If the user asks to add a product to cart and product id is missing, call searchProduct first, pick the best matching product from the tool response, and then call addProductToCart. If no products are found, ask a short clarification question."
});


const graph = new StateGraph(MessagesAnnotation)
    .addNode("tools", async (state, config) => {

        const lastMessage = state.messages[ state.messages.length - 1 ]

        const toolsCall = lastMessage.tool_calls

        const toolCallResults = await Promise.all(toolsCall.map(async (call) => {

            const tool = tools[ call.name ]
            if (!tool) {
                throw new Error(`Tool ${call.name} not found`)
            }
            const toolInput = call.args

            console.log("Invoking tool:", call.name, "with input:", call)

            const toolResult = await tool.func({ ...toolInput, token: config.metadata.token })

            return new ToolMessage({ content: toolResult, name: call.name })

        }))

        state.messages.push(...toolCallResults)

        return state
    })
    .addNode("chat", async (state, config) => {
        const response = await model.invoke([AGENT_SYSTEM_PROMPT, ...state.messages], { tools: [ tools.searchProduct, tools.addProductToCart ] })


        state.messages.push(new AIMessage({ content: response.text, tool_calls: response.tool_calls }))

        return state

    })
    .addEdge("__start__", "chat")
    .addConditionalEdges("chat", async (state) => {

        const lastMessage = state.messages[ state.messages.length - 1 ]

        if (lastMessage.tool_calls && lastMessage.tool_calls.length > 0) {
            return "tools"
        } else {
            return "__end__"
        }

    })
    .addEdge("tools", "chat")



const agent = graph.compile()


module.exports = agent