import { ChatGroq } from "@langchain/groq";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";

// Initialize the Groq chat model
const initGroqChat = () => {
  const model = new ChatGroq({
    apiKey: process.env.NEXT_PUBLIC_GROQ_API_KEY,
    model: "llama3-70b-8192",
    temperature: 0.1,
  });
  
  return model;
};

// Parse a transaction command with better error handling and fallback parsing
export const parseTransactionCommand = async (userInput) => {
  // First try manual parsing for common patterns
  const manualParsed = manualParseCommand(userInput.toLowerCase());
  if (manualParsed) {
    return manualParsed;
  }

  // Fallback to AI parsing
  const model = initGroqChat();
  
  const promptTemplate = PromptTemplate.fromTemplate(
    `Parse this transaction command and return ONLY a JSON object with the following structure.
Do not include any other text, explanations, or markdown formatting.

For sending transactions:
{
  "action": "send",
  "amount": number,
  "currency": "ETH" or "MON" or other supported currencies,
  "recipient": "username_without_@",
  "purpose": "reason (including hashtags like #dinner, #lunch, etc.) or empty string"
}

For balance inquiries:
{
  "action": "balance"
}

If not a valid command:
{
  "action": "invalid",
  "error": "error message"
}

Examples:
- "send 0.02 mon to @alice for #dinner" → amount: 0.02, currency: "MON", recipient: "alice", purpose: "#dinner"
- "send 1 eth to @bob for coffee" → amount: 1, currency: "ETH", recipient: "bob", purpose: "coffee"
- "pay @charlie 0.5 mon for #groceries" → amount: 0.5, currency: "MON", recipient: "charlie", purpose: "#groceries"

User input: {userInput}

JSON only:`
  );
  
  const outputParser = new StringOutputParser();
  const chain = promptTemplate.pipe(model).pipe(outputParser);
  
  try {
    const response = await chain.invoke({ userInput });
    
    // Clean the response to extract JSON
    let cleanedResponse = response.trim();
    
    // Remove markdown code blocks if present
    cleanedResponse = cleanedResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    
    // Find JSON object in the response
    const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleanedResponse = jsonMatch[0];
    }
    
    const parsed = JSON.parse(cleanedResponse);
    
    // Validate the parsed result
    if (!parsed.action) {
      throw new Error("Invalid action in parsed result");
    }
    
    return parsed;
  } catch (error) {
    console.error("Error parsing transaction command:", error);
    
    // Return a fallback manual parse attempt
    return manualParseCommand(userInput.toLowerCase()) || {
      action: "invalid",
      error: "Failed to parse transaction command. Please try again with a clearer instruction."
    };
  }
};

// Manual parsing function for common patterns
const manualParseCommand = (input) => {
  const lowerInput = input.toLowerCase().trim();
  
  // Check for balance queries
  if (lowerInput.includes('balance') || lowerInput.includes('how much') || lowerInput.includes('what\'s my')) {
    return { action: "balance" };
  }
  
  // Enhanced send patterns to support multiple currencies and hashtags
  const sendPatterns = [
    // send X currency to @user for purpose/hashtag
    /send\s+(\d*\.?\d+)\s+(eth|ether|mon|usdc|dai|btc)\s+to\s+@?(\w+)(?:\s+for\s+([#\w\s]+))?/,
    // transfer X currency to @user for purpose/hashtag
    /transfer\s+(\d*\.?\d+)\s+(eth|ether|mon|usdc|dai|btc)\s+to\s+@?(\w+)(?:\s+for\s+([#\w\s]+))?/,
    // pay @user X currency for purpose/hashtag
    /pay\s+@?(\w+)\s+(\d*\.?\d+)\s+(eth|ether|mon|usdc|dai|btc)(?:\s+for\s+([#\w\s]+))?/,
    // give X currency to @user for purpose/hashtag
    /give\s+(\d*\.?\d+)\s+(eth|ether|mon|usdc|dai|btc)\s+to\s+@?(\w+)(?:\s+for\s+([#\w\s]+))?/,
    // X currency to @user for purpose/hashtag (shorthand)
    /(\d*\.?\d+)\s+(eth|ether|mon|usdc|dai|btc)\s+to\s+@?(\w+)(?:\s+for\s+([#\w\s]+))?/
  ];
  
  for (const pattern of sendPatterns) {
    const match = lowerInput.match(pattern);
    if (match) {
      let amount, currency, recipient, purpose;
      
      if (pattern.source.includes('pay.*@')) {
        // pay @user amount currency pattern
        [, recipient, amount, currency, purpose] = match;
      } else {
        // send amount currency to @user pattern
        [, amount, currency, recipient, purpose] = match;
      }
      
      // Normalize currency
      const normalizedCurrency = normalizeCurrency(currency);
      
      // Clean up purpose (trim whitespace, preserve hashtags)
      const cleanedPurpose = purpose ? purpose.trim() : "";
      
      return {
        action: "send",
        amount: parseFloat(amount),
        currency: normalizedCurrency,
        recipient: recipient,
        purpose: cleanedPurpose
      };
    }
  }
  
  return null;
};

// Helper function to normalize currency names
const normalizeCurrency = (currency) => {
  const currencyMap = {
    'eth': 'ETH',
    'ether': 'ETH',
    'mon': 'MON',
    'usdc': 'USDC',
    'dai': 'DAI',
    'btc': 'BTC'
  };
  
  return currencyMap[currency.toLowerCase()] || currency.toUpperCase();
};

// Generate a response to the user with better handling
export const generateResponse = async (userInput, parsedCommand, transactionResult) => {
  // Handle different scenarios more explicitly
  if (parsedCommand.action === "invalid" || parsedCommand.error) {
    return "I couldn't understand your request. Try commands like:\n• Send 0.1 ETH to @alice\n• Send 0.02 MON to @bob for #dinner\n• Pay @charlie 5 USDC for #groceries\n• What's my balance?";
  }
  
  if (parsedCommand.action === "balance") {
    if (transactionResult.success) {
      return `Your current balance is ${parseFloat(transactionResult.balance).toFixed(4)} ${transactionResult.currency || 'ETH'}.`;
    } else {
      return `Sorry, I couldn't retrieve your balance. ${transactionResult.message}`;
    }
  }
  
  if (parsedCommand.action === "send") {
    if (transactionResult.success) {
      const purposeText = parsedCommand.purpose ? ` for ${parsedCommand.purpose}` : '';
      return `✅ Successfully sent ${parsedCommand.amount} ${parsedCommand.currency} to @${parsedCommand.recipient}${purposeText}!`;
    } else {
      return `❌ Failed to send payment to @${parsedCommand.recipient}. ${transactionResult.message}`;
    }
  }
  
  // Fallback to AI-generated response
  return generateAIResponse(userInput, walletConnected);
};

// Generate AI response based on user input
export const generateAIResponse = async (userMessage, walletConnected) => {
  try {
    // Check if the message is related to transactions or Web3
    const isWeb3Related = checkIfWeb3Related(userMessage);
    
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama3-8b-8192',
        messages: [
          {
            role: 'system',
            content: `You are an AI assistant for a Web3 payment app called QuickPay. 
            Your primary function is to help users send cryptocurrency payments using natural language.
            
            If the user asks about sending money or making a payment, extract the relevant information.
            
            If the user's message is not related to payments, respond politely and helpfully about Web3 topics.
            
            If the user asks about topics unrelated to Web3, cryptocurrency, or finance, politely explain that you're focused on helping with Web3 payments and related topics.
            
            Important guidelines:
            1. Be concise and helpful in your responses
            2. If you're unsure about a request, suggest using the /help command
            3. For payment-related questions, provide clear instructions
            4. If the user's request is completely unrelated to Web3, cryptocurrency, or finance, respond with: "I'm designed to help with Web3 payments and related topics. For assistance with this topic, please try a general-purpose AI assistant."
            5. Always maintain a friendly, professional tone`
          },
          {
            role: 'user',
            content: `My wallet is ${walletConnected ? 'connected' : 'not connected'}. Here's my message: ${userMessage}`
          }
        ],
        temperature: 0.5,
        max_tokens: 500,
      }),
    });

    const data = await response.json();
    let aiResponse = data.choices[0].message.content;
    
    // If the message is not Web3 related, ensure we give a polite refusal
    if (!isWeb3Related) {
      // Check if the AI already gave a polite refusal
      const hasRefusal = aiResponse.includes("I'm designed to help with Web3") || 
                         aiResponse.includes("I'm focused on helping with Web3") ||
                         aiResponse.includes("I can only assist with Web3");
      
      // If not, override with a polite refusal
      if (!hasRefusal) {
        aiResponse = "I'm designed to help with Web3 payments and related topics. For assistance with this topic, please try a general-purpose AI assistant. Type /help to see what I can help you with.";
      }
    }
    
    return aiResponse;
  } catch (error) {
    console.error('Error generating AI response:', error);
    return 'I encountered an error while processing your request. Please try again.';
  }
};

// Function to check if a message is related to Web3, crypto, or finance
function checkIfWeb3Related(message) {
  const web3Keywords = [
    'crypto', 'blockchain', 'bitcoin', 'ethereum', 'web3', 'token', 'wallet', 'nft',
    'defi', 'transaction', 'send', 'payment', 'eth', 'btc', 'coin', 'address',
    'balance', 'transfer', 'smart contract', 'gas', 'mining', 'block', 'ledger',
    'metamask', 'exchange', 'trade', 'invest', 'finance', 'money', 'currency',
    'quickpay', 'username', 'register', 'monad'
  ];
  
  const messageLower = message.toLowerCase();
  
  // Check for Web3 keywords
  for (const keyword of web3Keywords) {
    if (messageLower.includes(keyword)) {
      return true;
    }
  }
  
  // Check for payment patterns
  if (
    messageLower.match(/send [\d\.]+ (eth|btc|mon|dai|usdc)/i) ||
    messageLower.match(/pay [\d\.]+ (eth|btc|mon|dai|usdc)/i) ||
    messageLower.includes('@') ||
    messageLower.startsWith('/') ||
    messageLower.includes('0x')
  ) {
    return true;
  }
  
  return false;
}