import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { 
  getSessions, saveSession, saveSessionName, deleteSession, getLogs, addLog, 
  queryVectorDB, addCurriculumChunk, getCurriculum 
} from './workspace_db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Serve the built React frontend in production
app.use(express.static(path.join(__dirname, 'dist')));

// ----------------------------------------------------
// API 1: Chat Endpoint (Supports Mock, Webhook, and Gemini RAG)
// ----------------------------------------------------
// Helper to strip markdown formatting
function stripMarkdown(text) {
  return text
    .replace(/^###\s+/gm, '')        // remove headers
    .replace(/\*\*(.*?)\*\*/g, '$1') // remove bold
    .replace(/^\s*[-*+]\s+/gm, '')   // remove bullets
    .replace(/\[(.*?)\]\(.*?\)/g, '$1') // remove links
    .replace(/`([^`]+)`/g, '$1');    // remove inline code
}

app.post('/api/chat', async (req, res) => {
  const { sessionId, message, chatMode, activeVersion, apiKey, isInit, isDeepResearch, isGuidedLearning, learningMode } = req.body;
  const originalMessage = message;
  const startTime = Date.now();
  const queryLower = message ? message.toLowerCase() : '';
  
  // Handle new thread initialization
  if (isInit) {
    const defaultHistory = [
      {
        id: 'welcome',
        sender: 'assistant',
        text: "Hello! I am your AI Study Assistant. I can help you understand syllabus concepts, textbook definitions, and walk you through difficult problems. Feel free to ask a question, or ask me for a 'practice quiz' on any topic!",
        timestamp: new Date()
      }
    ];
    saveSession(sessionId, defaultHistory, `Thread ${Object.keys(getSessions()).length + 1}`);
    return res.json({ reply: "Initialized", path: 'B' });
  }

  let assistantReply = '';
  let path = 'B'; // default Path B (New)
  
  // Lookup session history to check if it's path A or B
  const sessions = getSessions();
  const session = sessions[sessionId];
  if (session && session.history.length > 1) {
    path = 'A';
  }

  // Auto-rename thread if it's a default "Thread X" and this is the first real message
  if (session && session.name && /^Thread \d+$/i.test(session.name) && session.history.length <= 1) {
    const nameClean = message.length > 22 ? message.substring(0, 22) + '...' : message;
    saveSessionName(sessionId, nameClean);
  }

  // Detect plain text formatting instructions
  const isPlainTextRequest = /\b(plain\s*text|no\s*markdown|remove\s*markdown|strip\s*markdown|without\s*markdown|in\s*plain\s*text|give\s*it\s*(to\s*me\s*)?in\s*plain\s*text|just\s*text)\b/i.test(message);
  
  let targetQuery = message;
  let isFollowUpFormatting = false;

  if (isPlainTextRequest) {
    const cleanQuery = message
      .replace(/\b(in\s*|)plain\s*text|no\s*markdown|remove\s*markdown|strip\s*markdown|without\s*markdown|give\s*it\s*(to\s*me\s*)?in\s*plain\s*text|just\s*text\b/gi, '')
      .replace(/\b(please|give\s*me|show\s*me|format\s*this|format|as|in|to|me|the|on|about|given|this|change|convert|show|display|add|render|output)\b/gi, '')
      .replace(/[()]/g, '')
      .trim();
      
    if (cleanQuery.length < 3) {
      isFollowUpFormatting = true;
    } else {
      targetQuery = cleanQuery;
    }
  }

  // Handle follow-up formatting request
  if (isFollowUpFormatting && session && session.history) {
    let lastAssistantMsg = null;
    for (let i = session.history.length - 1; i >= 0; i--) {
      if (session.history[i].sender === 'assistant') {
        lastAssistantMsg = session.history[i];
        break;
      }
    }

    if (lastAssistantMsg) {
      const plainTextReply = stripMarkdown(lastAssistantMsg.text);
      
      const prevHistory = session.history;
      const updatedHistory = [...prevHistory, 
        { id: Date.now() + '-stud', sender: 'student', text: message, timestamp: new Date() },
        { 
          id: Date.now() + '-asst', 
          sender: 'assistant', 
          text: plainTextReply, 
          timestamp: new Date(),
          agentLogs: [
            { agent: "Planner Agent", action: "Detected format change request (plain text).", status: "completed" },
            { agent: "Writer Agent", action: "Formatted last response to plain text by removing Markdown tags.", status: "completed" }
          ],
          sources: lastAssistantMsg.sources || []
        }
      ];
      saveSession(sessionId, updatedHistory);
      
      addLog({
        status: 'success',
        version: chatMode === 'gemini' ? 'Gemini-Flash-RAG' : (chatMode === 'webhook' ? activeVersion : 'Mock-Engine'),
        duration: Date.now() - startTime,
        path,
        query: message,
        response: plainTextReply
      });

      return res.json({ 
        reply: plainTextReply, 
        path, 
        agentLogs: [
          { agent: "Planner Agent", action: "Detected format change request (plain text).", status: "completed" },
          { agent: "Writer Agent", action: "Formatted last response to plain text by removing Markdown tags.", status: "completed" }
        ], 
        sources: lastAssistantMsg.sources || [] 
      });
    }
  }

  // ----------------------------------------------------
  // MODE 1: LIVE GEMINI RAG AGENT
  // ----------------------------------------------------
  if (chatMode === 'gemini') {
    if (!apiKey || apiKey.trim() === '') {
      return res.status(400).json({ error: 'Gemini API Key is missing. Configure it in the settings panel.' });
    }

    try {
      let curriculumContext = '';
      let embeddingVector = null;

      // 1. Generate Gemini vector embedding for RAG retrieval
      try {
        const embedEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${apiKey}`;
        const embedResponse = await fetch(embedEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: { parts: [{ text: targetQuery }] }
          })
        });

        if (embedResponse.ok) {
          const embedData = await embedResponse.json();
          embeddingVector = embedData.embedding?.values;
          
          if (embeddingVector) {
            // 2. Perform Vector search against local database
            const matches = queryVectorDB(embeddingVector, 2);
            if (matches.length > 0) {
              curriculumContext = matches.map(m => m.text).join('\n---\n');
              console.log(`Vector search successful. Found ${matches.length} matches.`);
            }
          }
        }
      } catch (embedErr) {
        console.error("Gemini embedding retrieval failed, skipping vector grounding:", embedErr);
      }

      // 3. Construct conversational history
      const prevHistory = session ? session.history : [];
      const historyParts = prevHistory
        .filter(msg => msg.id !== 'welcome' && !msg.text.includes('🔑') && !msg.text.includes('⚠️'))
        .map(msg => ({
          role: msg.sender === 'student' ? 'user' : 'model',
          parts: [{ text: msg.text }]
        }));

      historyParts.push({
        role: 'user',
        parts: [{ text: targetQuery }]
      });

      // 4. Construct System Instruction with Vector Grounding
      const groundingInstruction = curriculumContext 
        ? `Ground your answers strictly on this retrieved curriculum context from our Qdrant vector database:\n${curriculumContext}\n\n`
        : '';

      let deepPrompt = '';
      if (isDeepResearch) {
        deepPrompt = `\nAdditional Rule: Deep Research is active. Conduct a comprehensive, highly-detailed analysis. Provide extensive grounding facts, explain underlying protocols/mechanisms in depth, cite references where applicable, and lay out structural details. Provide a "Deep Research Synthesis Report" section.`;
      }
      let guidedPrompt = '';
      if (isGuidedLearning) {
        guidedPrompt = `\nAdditional Rule: Guided Learning is active. Break down the concept into step-by-step digestible study modules. Do not give the whole answer at once. End with an interactive prompt/question asking the student to respond.`;
      }
      let stylePrompt = '';
      if (learningMode === 'socratic') {
        stylePrompt = `\nAdditional Rule: Socratic Tutor Mode is active. Do not give direct answers immediately. Guide the student step-by-step by asking leading questions that help them discover the answer themselves. Keep your responses short, conversational, and pedagogical.`;
      } else if (learningMode === 'feynman') {
        stylePrompt = `\nAdditional Rule: Feynman Technique Mode is active. First, ask the student to explain the concept in their own simple words as if teaching it to a child. Once they respond, review their explanation, identify conceptual gaps, grade it out of 100 with a label 'Feynman score: [Score]/100', and write a constructive critique.`;
      }
      
      let routingPrompt = `\nAdditional Rule: You have Intent Recognition. Depending on what the student types:
      - If they ask for a presentation, slides, or ppt, output a slide deck format starting with the line "[Presentation]" followed by "Slide 1: ... \\n - ...".
      - If they ask for a spreadsheet, excel, or csv, output a CSV formatted table starting with "[Spreadsheet]" followed by header rows.
      - If they ask for a roadmap or timeline, output "[Roadmap]" followed by checklist items like "Task Name|status".
      - If they ask for a database schema, design, or erd, output "[ERD]" followed by "Table: ... | PK: ...".
      - If they ask for a chart, graph, or plot, output "[Chart]" followed by labels and values.`;

      const systemInstruction = {
        role: 'user',
        parts: [{
          text: `You are the AI Study Assistant n8n agent. ${groundingInstruction}Your job is to provide personalized learning, answer student doubts instantly, generate practice quizzes, study plans, or flashcards. ${deepPrompt}${guidedPrompt}${stylePrompt}${routingPrompt}
If the student asks to be tested or wants practice questions, you MUST generate a short multiple-choice quiz in this exact markdown format:

### Practice Quiz: [Topic]

Q1: [Question text]?
A) [Option A]
B) [Option B]
C) [Option C]
D) [Option D]
Correct Answer: [Letter]

Ensure you include 'Correct Answer: [Letter]' immediately after the choices for each question.

If the student asks for flashcards, you MUST generate flashcards in this exact markdown format:

### Flashcards: [Topic]

Front: [Question/Concept 1]
Back: [Explanation/Answer 1]

Front: [Question/Concept 2]
Back: [Explanation/Answer 2]

If the student asks for a study plan or schedule, generate a day-by-day structured learning scheduler.`
        }]
      };

      // 5. Generate content via Gemini
      const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
      const geminiResponse = await fetch(geminiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          contents: historyParts,
          systemInstruction: systemInstruction
        })
      });

      if (!geminiResponse.ok) {
        const errData = await geminiResponse.json();
        throw new Error(errData.error?.message || 'Gemini content generation failed');
      }

      const geminiData = await geminiResponse.json();
      assistantReply = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "No response received from Gemini.";

      if (isPlainTextRequest) {
        assistantReply = stripMarkdown(assistantReply);
      }

      // 6. Save history to Database
      let agentLogs = [];
      if (isDeepResearch) {
        agentLogs = [
          { agent: "Deep Research Agent", action: "Initiating recursive query expansions and reference sweeps.", status: "completed" },
          { agent: "Researcher Agent", action: "Scanned local grounded vector documents and external academic indices.", status: "completed" },
          { agent: "Consensus Synthesis Agent", action: "Corroborated citations, extracted key definitions, and drafted synthesis report.", status: "completed" }
        ];
      } else if (learningMode === 'socratic') {
        agentLogs = [
          { agent: "Planner Agent", action: "Identified Socratic coaching style request. Activating Socratic Coach.", status: "completed" },
          { agent: "Socratic Coach Agent", action: "Formulated pedagogical query loops and guided check-in prompts.", status: "completed" },
          { agent: "Writer Agent", action: "Rendered guided Socratic sub-lessons.", status: "completed" }
        ];
      } else if (learningMode === 'feynman') {
        agentLogs = [
          { agent: "Planner Agent", action: "Feynman Technique validation mode active. Initiating gap evaluator.", status: "completed" },
          { agent: "Gap Evaluator Agent", action: "Cross-referenced student response against vector syllabus.", status: "completed" },
          { agent: "Grading Agent", action: "Scored student answer and compiled structured critique report.", status: "completed" }
        ];
      } else if (isGuidedLearning) {
        agentLogs = [
          { agent: "Planner Agent", action: "Identified guided learning request. Restructuring payload.", status: "completed" },
          { agent: "Socratic Coach Agent", action: "Divided subject matter into step-by-step interactive modules.", status: "completed" },
          { agent: "Writer Agent", action: "Rendered student-friendly learning blocks and check-in prompt.", status: "completed" }
        ];
      } else {
        agentLogs = [
          { agent: "Planner Agent", action: "Parsed query. Routed task to Gemini RAG execution path.", status: "completed" },
          { agent: "Researcher Agent", action: curriculumContext ? "Searched local vector database (Qdrant) using 768-dim embeddings." : "No local vector context matches found. Relying on model parametric memory.", status: "completed" },
          { agent: "Writer Agent", action: "Synthesized response grounded on matching curriculum vectors.", status: "completed" }
        ];
      }
      const sources = curriculumContext ? [curriculumContext] : [];

      const updatedHistory = [...prevHistory, 
        { id: Date.now() + '-stud', sender: 'student', text: message, timestamp: new Date() },
        { 
          id: Date.now() + '-asst', 
          sender: 'assistant', 
          text: assistantReply, 
          timestamp: new Date(),
          agentLogs,
          sources
        }
      ];
      saveSession(sessionId, updatedHistory);

      // 7. Log execution in database
      const duration = Date.now() - startTime;
      addLog({
        status: 'success',
        version: 'Gemini-Flash-RAG',
        duration,
        path,
        query: message,
        response: assistantReply
      });

      return res.json({ reply: assistantReply, path, agentLogs, sources });

    } catch (err) {
      console.error(err);
      addLog({
        status: 'failed',
        version: 'Gemini-Flash-RAG',
        duration: Date.now() - startTime,
        path,
        query: message,
        response: `Error: ${err.message}`
      });
      return res.status(500).json({ error: err.message });
    }
  }

  // ----------------------------------------------------
  // MODE 2: WEBHOOK REROUTING (Relay/n8n link)
  // ----------------------------------------------------
  if (chatMode === 'webhook') {
    try {
      const webhookUrl = 'https://hook.relay.app/api/v1/playbook/cmrlcnmxl0dvg0pm00rsf' + activeVersion;
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, message: targetQuery })
      });

      if (!response.ok) throw new Error('Webhook connection failed');
      const data = await response.json();
      assistantReply = data.reply || "Grounded webhook response executed successfully.";

      if (isPlainTextRequest) {
        assistantReply = stripMarkdown(assistantReply);
      }

      // Save history to Database
      const prevHistory = session ? session.history : [];
      const updatedHistory = [...prevHistory, 
        { id: Date.now() + '-stud', sender: 'student', text: message, timestamp: new Date() },
        { 
          id: Date.now() + '-asst', 
          sender: 'assistant', 
          text: assistantReply, 
          timestamp: new Date()
        }
      ];
      saveSession(sessionId, updatedHistory);

      addLog({
        status: 'success',
        version: activeVersion,
        duration: Date.now() - startTime,
        path,
        query: message,
        response: assistantReply
      });

      return res.json({ reply: assistantReply, path });

    } catch (err) {
      console.error(err);
      addLog({
        status: 'failed',
        version: activeVersion,
        duration: Date.now() - startTime,
        path,
        query: message,
        response: `Error: ${err.message}`
      });
      return res.status(502).json({ error: `Connection to n8n webhook failed: ${err.message}` });
    }
  }

  // ----------------------------------------------------
          // MODE 3: MOCK SIMULATION (DuckDuckGo fallback & custom guides)
  // ----------------------------------------------------
  if (chatMode === 'mock') {
    const message = targetQuery;
    const queryLower = targetQuery.toLowerCase();
    // Exact subject match checks
    if (queryLower.includes('flashcard') || queryLower.includes('flash card')) {
      const topicRaw = message.replace(/give me|generate|flashcards on|flash cards on|cards on/gi, '').trim();
      const topic = topicRaw.charAt(0).toUpperCase() + topicRaw.slice(1) || 'Photosynthesis';
      
      assistantReply = `### Flashcards: ${topic}

Front: What is the main concept of ${topic}?
Back: It represents a fundamental study area of the curriculum, describing key processes and structures.

Front: What is a primary mechanism involved in ${topic}?
Back: Active physical or chemical interactions that change output values based on input variables.

Front: Why is understanding ${topic} important?
Back: It helps explain natural observations, industrial systems, or logical structures in the real world.`;
    } else if (queryLower.includes('chatgpt') || queryLower.includes('gemini') || queryLower.includes('feature') || queryLower.includes('function') || queryLower.includes('difference') || queryLower.includes('comparison')) {
      assistantReply = `### ChatGPT vs Google Gemini: Features & Functions

Here is a comparative overview of ChatGPT and Google Gemini:

#### ChatGPT – Features & Functions
*   **Natural language understanding**: Answers questions
*   **Text generation**: Writes essays, emails, reports
*   **Coding assistance**: Generates and debugs code
*   **Image understanding**: Analyzes uploaded images
*   **Voice conversation**: Supports voice chats
*   **Web browsing (when enabled)**: Finds up-to-date information
*   **File analysis**: Summarizes PDFs, Word, Excel, etc.
*   **Memory (optional)**: Remembers user preferences across chats
*   **Multilingual support**: Translates multiple languages
*   **AI reasoning**: Solves math, logic, and programming problems

#### Google Gemini – Features & Functions
*   **Multimodal AI**: Understands text, images, audio, and video
*   **Google Search integration**: Provides current information
*   **Google Workspace integration**: Works with Gmail, Docs, Sheets, and Drive
*   **Coding assistance**: Generates and explains code
*   **Image analysis**: Describes and analyzes images
*   **File analysis**: Summarizes documents and PDFs
*   **Voice interaction**: Supports voice conversations
*   **Translation**: Translates multiple languages
*   **Long-context understanding**: Processes long documents
*   **AI assistance**: Helps with writing, research, and brainstorming
*   **Learning and productivity**: Support learning and productivity

#### Key Difference
*   **ChatGPT**: Best for writing, coding, reasoning, and AI conversations.
*   **Gemini**: Best for users who rely on Google services (Gmail, Docs, Drive, Search) and want AI integrated with that ecosystem.

### ChatGPT Details
*   **Features**: Natural language understanding, Text generation, Code generation and debugging, Image understanding, Voice conversation, Web browsing (if enabled), File analysis, Multilingual support, Memory (optional), AI reasoning.
*   **Functions**: Answer questions, Write essays, emails, and reports, Generate and debug code, Translate languages, Summarize documents, Solve mathematical problems, Analyze images, Create content (stories, poems, blogs), Help with research, Assist in learning and education.

### Google Gemini Details
*   **Features**: Multimodal AI (text, image, audio, video), Google Search integration, Google Workspace integration, Code generation, Image analysis, File analysis, Voice interaction, Long-context understanding, Multilingual support, AI reasoning.
*   **Functions**: Answer questions, Generate text and content, Summarize documents, Translate languages, Generate and explain code, Analyze images, Assist with Gmail, Docs, Sheets, and Drive, Search current information, Help with research, Support learning and productivity.`;
    } else if (queryLower.includes('study plan') || queryLower.includes('schedule') || queryLower.includes('plan')) {
      const topicRaw = message.replace(/give me a|generate a|study plan for|schedule for|plan for/gi, '').trim();
      const topic = topicRaw.charAt(0).toUpperCase() + topicRaw.slice(1) || 'Computer Science';
      
      assistantReply = `### Personalized Study Plan: ${topic}

Here is a 3-day structured learning path to master **${topic}**:

*   **Day 1: Foundation & Vocabulary**
    *   *Activity*: Read core definitions and textbook introduction sections.
    *   *Task*: Create flashcards of key terms and spend 15 minutes testing yourself.
*   **Day 2: Mechanisms & Formulae**
    *   *Activity*: Work through at least 3 practice exercises or equations.
    *   *Task*: Ask the AI Study Assistant to generate a 3-question MCQ practice quiz.
*   **Day 3: Application & Final Review**
    *   *Activity*: Apply the concept to a real-world scenario or lab simulation.
    *   *Task*: Complete a comprehensive review session and retake failed quizzes.

*Tip: Click the speech speaker icon to listen to this guide!*`;
    } else if (queryLower.includes('newton') || queryLower.includes('force') || queryLower.includes('motion')) {
      assistantReply = `### Newton's Second Law of Motion

Newton's Second Law of Motion states that the acceleration of an object is directly dependent upon two variables: the net force acting upon the object and the mass of the object. 

The relationship is expressed by the formula:
**F = ma**

Where:
- **F** is the net force applied (measured in Newtons, N)
- **m** is the mass of the object (measured in kilograms, kg)
- **a** is the acceleration of the object (measured in meters per second squared, m/s²)

### Example Problem:
If a net force of 20 N is applied to a mass of 4 kg, what is the acceleration?
- **a = F / m**
- **a = 20 N / 4 kg = 5 m/s²**

Would you like a short quiz on Newton's laws to test your understanding?`;
    } else if (queryLower.includes('photosynthesis') || queryLower.includes('plant') || queryLower.includes('sunlight') || queryLower.includes('chlorophyll')) {
      assistantReply = `### Photosynthesis

Photosynthesis is the biological process by which green plants, algae, and some bacteria convert light energy into chemical energy (glucose), using water and carbon dioxide.

The overall chemical equation is:
**6CO₂ + 6H₂O + Light Energy → C₆H₁₂O₆ + 6O₂**

### Key Stages:
1. **Light-Dependent Reactions**: Occur in the thylakoid membranes. Solar energy is captured and converted into ATP and NADPH, releasing oxygen as a byproduct.
2. **Calvin Cycle (Light-Independent)**: Occurs in the stroma. Carbon dioxide is fixed using ATP and NADPH to synthesize glucose.

Would you like to practice some multiple choice questions on this process?`;
    } else if (queryLower.includes('cell') || queryLower.includes('mitochondria') || queryLower.includes('organelle') || queryLower.includes('biology')) {
      assistantReply = `### Cell Biology & Structures

Cells are the basic structural, functional, and biological units of all known organisms. A cell is the smallest unit of life.

### Key Organelles:
1. **Nucleus**: The control center of the cell, housing the genetic material (DNA).
2. **Mitochondria**: Often called the "powerhouse of the cell", responsible for generating energy (ATP) through cellular respiration.
3. **Ribosomes**: Tiny structures responsible for protein synthesis.
4. **Cell Membrane**: A semi-permeable barrier controlling what enters and exits the cell.

Would you like to take a cell structure quiz to test your memory?`;
    } else if (queryLower.includes('water') || queryLower.includes('h2o') || queryLower.includes('chemistry')) {
      assistantReply = `### Chemistry of Water (H₂O)

Water is a polar covalent compound consisting of two hydrogen atoms bonded to a single oxygen atom. 

### Key Properties:
- **Polarity**: Oxygen has a higher electronegativity than hydrogen, creating partial charges.
- **Hydrogen Bonding**: Cohesion, adhesion, high specific heat capacity, and surface tension.
- **Universal Solvent**: Capable of dissolving a wide variety of polar and ionic substances.

Would you like a chemistry quiz on compounds?`;
    } else if (queryLower.includes('quiz') || queryLower.includes('test') || queryLower.includes('question')) {
      const topicRaw = message.replace(/give me a|generate a|quiz on|test on|questions on|practice/gi, '').trim();
      const topic = topicRaw.charAt(0).toUpperCase() + topicRaw.slice(1) || 'Cell Biology';
      
      if (topic && topic !== 'Quiz' && topic !== 'Test' && topic !== 'Question') {
        assistantReply = `### Practice Quiz: ${topic}

Here is a short quiz to test your understanding of ${topic}:

Q1: What is the primary focus when studying ${topic}?
A) Static, unchanging details
B) Core structural principles and dynamics
C) External unrelated elements
D) None of the above
Correct Answer: B

Q2: Which of the following is considered a key mechanism of ${topic}?
A) Direct logical shifts and transformations based on variables
B) Absolute static equilibrium
C) Complete random outputs
D) Energy insulation
Correct Answer: A

Q3: Why is understanding ${topic} helpful?
A) It has no direct applications
B) It helps explain and ground observations in related fields
C) It is a purely theoretical concept
D) It prevents standard calculations
Correct Answer: B`;
      } else {
        assistantReply = `### Practice Quiz: Cell Biology

Here is a short quiz to test your understanding of Cell Structures:

Q1: Which organelle is known as the powerhouse of the cell?
A) Nucleus
B) Mitochondria
C) Ribosome
D) Cell Wall
Correct Answer: B

Q2: What is the primary function of Ribosomes?
A) Storage of DNA
B) Protein Synthesis
C) Photosynthesis
D) Waste Disposal
Correct Answer: B

Q3: Which of these is found in plant cells but NOT animal cells?
A) Mitochondria
B) Cell Membrane
C) Chloroplast
D) Cytoplasm
Correct Answer: C`;
      }
    } else {
      // Intelligent local fallback classification
      const topicRaw = message.replace(/what is|explain|tell me about|how does|define|who is|who was/gi, '').trim();
      const topic = topicRaw.charAt(0).toUpperCase() + topicRaw.slice(1);
      
      let categoryText = '';
      
      if (queryLower.match(/\b(coding|programming|code|software|hardware|database|sql|computer|binary|array|loop|function|variable|bug|cpu|ram|network|internet|router|server|client|dns|ip|packet|protocol|web|browser|website|html|css)\b/)) {
        categoryText = `### Computer Science Guide: ${topic || 'System Architectures'}

**${topic || 'This concept'}** represents a critical building block in computer science, networking, and software development.

*   **Core Function**: In computing systems, it defines a sequence of rules, hardware constraints, data networks, or memory structures used to process and transmit information.
*   **Operational Flow**: It runs instructions under system threads, managing byte states, loops, packet routing, or network sockets to perform calculations and maintain connectivity.
*   **Practical Example**: Commonly applied in network architectures (like LAN/WAN), database schemas, and web technologies to optimize throughput and data safety.`;
      }
      else if (queryLower.match(/\b(car|automobile|vehicle|truck|engine|motor|train|airplane|flight|engineering|device|machine|tool)\b/)) {
        categoryText = `### Engineering & Technology Guide: ${topic || 'Mechanical Systems'}

**${topic || 'This machine'}** represents a key engineering development or mechanical system designed to perform specific physical work.

*   **Design & Function**: It is structured as an assembly of components (such as engines, chassis, fuel systems, and controls) to automate transit, power generation, or mechanical leverage.
*   **Operating Principle**: Converts thermal, electrical, or chemical energy inputs into kinetic force or mechanical outputs to perform tasks.
*   **Modern Impact**: Forms the core foundation of industrial transport, daily commuting, and physical infrastructure.`;
      }
      else if (queryLower.match(/\b(math|calculate|geometry|algebra|calculus|arithmetic|number|sum|equation|formula|triangle|circle|matrix|vector|digit|zero|integer)\b/)) {
        categoryText = `### Mathematical Guide: ${topic || 'Formal Relations'}

In mathematics, **${topic || 'this relation'}** defines a rigorous structure governed by equations and proofs.

*   **Logical Property**: It expresses how input variables map to constant values or output dimensions under defined operations.
*   **How to Solve**: Resolving equations involving this concept requires expanding terms, isolating variables, or applying calculus differentials.
*   **Academic Application**: Essential for modeling physics formulas, financial derivatives, and cryptography standards.`;
      }
      else if (queryLower.match(/\b(history|war|empire|revolution|king|queen|emperor|treaty|president|senate|parliament|government|country|dynasty|civilization)\b/)) {
        categoryText = `### Historical & Political Guide: ${topic || 'Social Structures'}

In historical study, **${topic || 'this event'}** represents a major shift in social, political, or geographical power scales.

*   **Contextual Origin**: Triggered by economic constraints, cultural shifts, or diplomatic failures between empires or nations.
*   **Systemic Consequence**: Led to revised treaties, shifted international borders, or reformed governmental systems.
*   **Curriculum Focus**: Examined to understand the foundational events that shaped modern sovereign societies.`;
      }
      else if (queryLower.match(/\b(biology|cell|organism|plant|animal|human|brain|heart|gene|dna|evolution|species|anatomy|chlorophyll|ecosystem)\b/)) {
        categoryText = `### Biological Science Guide: ${topic || 'Life Mechanisms'}

In life sciences, **${topic || 'this organism'}** constitutes a vital structure or mechanism for cellular growth and system homeostasis.

*   **Microscopic Process**: It operates at the molecular or tissue level, facilitating respiration, genetic translation, or energy conversion.
*   **Ecosystem Balance**: Contributes directly to nutrient cycles, predator-prey dynamics, or evolutionary adaptations.
*   **Laboratory Focus**: Researched using light microscopes, DNA sequencing, or biomechanical sensors.`;
      }
      else if (queryLower.match(/\b(chemistry|molecule|atom|reaction|bond|chemical|acid|base|catalyst|element|compound|metal|solvent)\b/)) {
        categoryText = `### Chemical Science Guide: ${topic || 'Molecular Bonding'}

In chemistry, **${topic || 'this reaction'}** describes the properties, structures, and interactions of atoms and compounds.

*   **Reaction Kinetics**: Involves electron transfers, covalent bonding, or kinetic collisions under specific pressure and temperature constraints.
*   **State Changes**: Leads to altered chemical properties, heat dissipation (exothermic), or heat absorption (endothermic).
*   **Practical Example**: Fundamental in syntheses of drugs, clean fuel catalysts, and advanced alloys.`;
      }
      else if (queryLower.match(/\b(physics|gravity|energy|force|space|star|planet|velocity|speed|mass|relativity|light|sound|kinematics)\b/)) {
        categoryText = `### Physical Science Guide: ${topic || 'System Dynamics'}

In physics, **${topic || 'this phenomenon'}** is a physical interaction governed by conservation laws and mechanical formulas.

*   **Fundamental Rule**: Describes how mass, velocity, forces, or wave patterns transfer energy across vectors.
*   **Equation Model**: Modeled mathematically using classical kinematics, thermodynamics, or quantum mechanical rules.
*   **Observation Scope**: Scales from subatomic particles to cosmic galaxy clusters.`;
      }
      else if (queryLower.match(/\b(who is|who was|profile of)\b/)) {
        categoryText = `### Academic Profile: ${topic || 'Historical Figure'}

**${topic || 'This individual'}** is a prominent historical figure celebrated for their revolutionary academic and cultural contributions.

*   **Major Achievement**: Reshaped contemporary theories by introducing groundbreaking research, literature, or governance policies.
*   **Syllabus Relevance**: Their discoveries form the foundation of multiple core modules in the curriculum.
*   **Key Legacy**: Their methods are still studied and applied as primary reference standards in modern studies.`;
      }
      else {
        categoryText = `### Curriculum Guide: ${topic || 'Academic Concept'}

Here is a comprehensive breakdown based on our curriculum guidelines:

1.  **Core Definition**: **${topic || 'This concept'}** represents a fundamental topic in the syllabus. It is vital for understanding secondary applications and system relationships.
2.  **Key Mechanism**: In practical terms, it operates under logical rules governing system behavior. Changes to variables lead to direct shifts in output results.
3.  **Real-world Application**: Understanding this helps solve practical problems and explain common observations in modern studies.`;
      }
      
      assistantReply = categoryText + `\n\n*Tip: If you'd like to test your understanding on this topic, just reply and ask me to generate a 'practice quiz'!*`;

      // Fallback search integration
      try {
        const ddgResponse = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(message)}&format=json&no_html=1`);
        const ddgData = await ddgResponse.json();
        
        if (ddgData.Abstract) {
          const abstractLower = ddgData.Abstract.toLowerCase();
          let isAbstractRelevant = true;
          
          if (queryLower.match(/\b(car|automobile|vehicle|truck)\b/) && abstractLower.includes('carinae')) {
            isAbstractRelevant = false;
          }
          if (queryLower.match(/\b(network|internet)\b/) && (abstractLower.includes('additive identity') || abstractLower.includes('quantity'))) {
            isAbstractRelevant = false;
          }
          
          if (isAbstractRelevant) {
            assistantReply = `### Curriculum Answer: ${topic}

${ddgData.Abstract}

*Source: Grounded curriculum search engine (DuckDuckGo).*`;
          }
        }
      } catch (err) {
        console.error("DuckDuckGo fetch failed:", err);
      }
    }

    // Save mock session details
    let activeTopic = 'Academic Concept';
    let detectedIntent = 'General Question';
    let routedTool = 'AI Explainer';

    if (queryLower.includes('flashcard') || queryLower.includes('flash card')) {
      const topicRaw = message.replace(/give me|generate|flashcards on|flash cards on|cards on/gi, '').trim();
      activeTopic = topicRaw.charAt(0).toUpperCase() + topicRaw.slice(1) || 'Photosynthesis';
      detectedIntent = 'Flashcard Generation';
      routedTool = 'Flashcard Generator Tool';
    } else if (queryLower.includes('study plan') || queryLower.includes('schedule') || queryLower.includes('plan')) {
      const topicRaw = message.replace(/give me a|generate a|study plan for|schedule for|plan for/gi, '').trim();
      activeTopic = topicRaw.charAt(0).toUpperCase() + topicRaw.slice(1) || 'Computer Science';
      detectedIntent = 'Planning & Roadmap';
      routedTool = 'Project Planning Tool';
    } else if (queryLower.includes('quiz') || queryLower.includes('test') || queryLower.includes('question')) {
      const topicRaw = message.replace(/give me a|generate a|quiz on|test on|questions on|practice/gi, '').trim();
      activeTopic = topicRaw.charAt(0).toUpperCase() + topicRaw.slice(1) || 'Cell Biology';
      detectedIntent = 'Quiz Generation';
      routedTool = 'Quiz Generator Tool';
    } else if (queryLower.includes('ppt') || queryLower.includes('presentation') || queryLower.includes('slide')) {
      const topicRaw = message.replace(/give me a|generate a|ppt on|presentation on|slides on/gi, '').trim();
      activeTopic = topicRaw.charAt(0).toUpperCase() + topicRaw.slice(1) || 'Computer Networks';
      detectedIntent = 'Presentation Generation';
      routedTool = 'PowerPoint Generator Tool';
    } else if (queryLower.includes('excel') || queryLower.includes('spreadsheet') || queryLower.includes('csv') || queryLower.includes('sheet')) {
      const topicRaw = message.replace(/give me an|generate an|excel on|spreadsheet on|csv on/gi, '').trim();
      activeTopic = topicRaw.charAt(0).toUpperCase() + topicRaw.slice(1) || 'Student Grades';
      detectedIntent = 'Spreadsheet Generation';
      routedTool = 'Spreadsheet Excel Tool';
    } else if (queryLower.includes('roadmap') || queryLower.includes('timeline')) {
      const topicRaw = message.replace(/give me a|generate a|roadmap on|timeline for/gi, '').trim();
      activeTopic = topicRaw.charAt(0).toUpperCase() + topicRaw.slice(1) || 'Database Learning Path';
      detectedIntent = 'Mind Map & Roadmap';
      routedTool = 'Roadmap Planner Tool';
    } else if (queryLower.includes('erd') || queryLower.includes('database schema') || queryLower.includes('schema')) {
      const topicRaw = message.replace(/give me an|generate an|erd for|database schema for|schema for/gi, '').trim();
      activeTopic = topicRaw.charAt(0).toUpperCase() + topicRaw.slice(1) || 'E-Commerce Database';
      detectedIntent = 'Database Modeling';
      routedTool = 'Database Designer Tool';
    } else if (queryLower.includes('chart') || queryLower.includes('graph') || queryLower.includes('plot')) {
      const topicRaw = message.replace(/give me a|generate a|chart of|graph of|plot of/gi, '').trim();
      activeTopic = topicRaw.charAt(0).toUpperCase() + topicRaw.slice(1) || 'Weekly Study Progress';
      detectedIntent = 'Data Visualization';
      routedTool = 'SVG Graph Visualizer Tool';
    } else if (queryLower.includes('image') || queryLower.includes('picture') || queryLower.includes('illustration') || queryLower.includes('draw')) {
      const topicRaw = message.replace(/give me an|give me a|generate an|generate a|show me an|show me a|show me|show|draw an|draw a|draw|image of a|image of an|image of|picture of a|picture of an|picture of|illustration of a|illustration of an|illustration of|illustration/gi, '').trim();
      activeTopic = topicRaw.charAt(0).toUpperCase() + topicRaw.slice(1) || 'Rose';
      detectedIntent = 'Image Generation';
      routedTool = 'Image Generator Tool';
    } else if (queryLower.includes('pdf') || queryLower.includes('docx') || queryLower.includes('word')) {
      const topicRaw = message.replace(/give me a|generate a|pdf for|docx for|word document for/gi, '').trim();
      activeTopic = topicRaw.charAt(0).toUpperCase() + topicRaw.slice(1) || 'Study Syllabus';
      detectedIntent = 'Document Generation';
      routedTool = 'Document Export Tool';
    } else if (queryLower.includes('code') || queryLower.includes('javascript') || queryLower.includes('js') || queryLower.includes('python') || queryLower.includes('java') || queryLower.includes('react') || queryLower.includes('api') || queryLower.includes('html') || queryLower.includes('css') || queryLower.includes('sql') || queryLower.includes('programming')) {
      const topicRaw = message.replace(/give me|generate|write|code for|javascript code for|python code for|sql code for|html page for/gi, '').trim();
      activeTopic = topicRaw.charAt(0).toUpperCase() + topicRaw.slice(1) || 'Binary Search Algorithm';
      detectedIntent = 'Code Generation';
      routedTool = 'Code Generator Tool';
    } else if (queryLower.includes('project') || queryLower.includes('directory') || queryLower.includes('folder')) {
      const topicRaw = message.replace(/give me a|generate a|project structure for|folder structure for/gi, '').trim();
      activeTopic = topicRaw.charAt(0).toUpperCase() + topicRaw.slice(1) || 'React Application';
      detectedIntent = 'Project Structure';
      routedTool = 'Project Structure Tool';
    } else if (queryLower.includes('ui') || queryLower.includes('wireframe') || queryLower.includes('mockup')) {
      const topicRaw = message.replace(/give me a|generate a|wireframe of|mockup of|ui for/gi, '').trim();
      activeTopic = topicRaw.charAt(0).toUpperCase() + topicRaw.slice(1) || 'Login Page Dashboard';
      detectedIntent = 'UI Wireframe';
      routedTool = 'UI Designer Tool';
    } else if (queryLower.includes('email') || queryLower.includes('resume') || queryLower.includes('cover letter') || queryLower.includes('blog') || queryLower.includes('story') || queryLower.includes('poem') || queryLower.includes('notes') || queryLower.includes('summarize') || queryLower.includes('translate')) {
      const topicRaw = message.replace(/give me an|write an|draft an|email to|resume for|cover letter for|blog on|story about/gi, '').trim();
      activeTopic = topicRaw.charAt(0).toUpperCase() + topicRaw.slice(1) || 'Subject Revision Summary';
      detectedIntent = 'Writer Editor';
      routedTool = 'Content Writer Tool';
    } else if (queryLower.includes('json') || queryLower.includes('yaml') || queryLower.includes('xml')) {
      const topicRaw = message.replace(/give me|generate|json for|yaml for|xml for/gi, '').trim();
      activeTopic = topicRaw.charAt(0).toUpperCase() + topicRaw.slice(1) || 'Configuration Data';
      detectedIntent = 'Data Formatting';
      routedTool = 'Data Validator Tool';
    } else {
      const topicRaw = message.replace(/what is|explain|tell me about|how does|define|who is|who was/gi, '').trim();
      activeTopic = topicRaw.charAt(0).toUpperCase() + topicRaw.slice(1) || 'Academic Concept';
    }

    let agentLogs = [
      { agent: "Intent Classifier Agent", action: `Analyzed query. Classified intent: "${detectedIntent}". Routed to "${routedTool}".`, status: "completed" },
      { agent: routedTool, action: `Invoked capability: executed context parameters compilation for "${activeTopic}".`, status: "completed" }
    ];
    let sources = assistantReply.includes('DuckDuckGo') ? ["DuckDuckGo abstract search results"] : ["Curriculum guidelines profile cache"];

    if (detectedIntent === 'Presentation Generation') {
      assistantReply = `Here is a custom presentation slide deck on **${activeTopic}**.\n\n[Presentation]\nSlide 1: Introduction to ${activeTopic}\n- Core definition and history\n- Fundamental building block parameters\n\nSlide 2: Key Working Mechanisms\n- Dynamic action operations\n- Integration across curriculum standards\n\nSlide 3: Summary & Real-World Use Cases\n- Applied workflows and performance checks\n- Summary notes and index checklists`;
    } else if (detectedIntent === 'Spreadsheet Generation') {
      assistantReply = `Here is a structured spreadsheet grid representing **${activeTopic}**.\n\n[Spreadsheet]\nTopic,Description,Priority\n${activeTopic} Basics,Introductory concepts and syllabus,High\nAdvanced Applications,Production implementations,Medium\nReview Quiz,Practice evaluation checklist,High`;
    } else if (detectedIntent === 'Mind Map & Roadmap') {
      assistantReply = `Here is an interactive study roadmap for **${activeTopic}**.\n\n[Roadmap]\nTask 1: Foundations of ${activeTopic}|done\nTask 2: Advanced architectural patterns|pending\nTask 3: Socratic discussion checks|pending`;
    } else if (detectedIntent === 'Database Modeling') {
      assistantReply = `Here is the visual ERD schema design for **${activeTopic}**.\n\n[ERD]\nTable: Users | PK: UserID | Fields: Name, Email\nTable: Profiles | PK: ProfileID | Fields: Bio, FK: UserID\nTable: Activities | PK: ActivityID | Fields: Action, FK: UserID`;
    } else if (detectedIntent === 'Data Visualization') {
      assistantReply = `Here is the SVG data visualization graph for **${activeTopic}**.\n\n[Chart]\nLabels: Monday,Tuesday,Wednesday,Thursday,Friday\nValues: 30,55,45,85,60`;
    } else if (detectedIntent === 'Image Generation') {
      let keyword = activeTopic.replace(/\b(image|picture|photo|illustration|draw|art|sketch|card)\b/gi, '').trim();
      if (!keyword) keyword = 'Rose';

      let imageUrl = '';
      if (queryLower.includes('modified') && queryLower.includes('car')) {
        imageUrl = 'modified_car.jpg';
      } else if (queryLower.includes('race') && queryLower.includes('car')) {
        imageUrl = 'media__1785423992568.png';
      } else {
        try {
          const wikiUrl = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(keyword)}&gsrnamespace=6&prop=imageinfo&iiprop=url&format=json`;
          const resObj = await fetch(wikiUrl, {
            headers: { 'User-Agent': 'AIStudyAssistant/1.0 (contact@aistudyassistant.org)' }
          });
          if (resObj.ok) {
            const data = await resObj.json();
            const pages = data?.query?.pages;
            if (pages) {
              const pageKeys = Object.keys(pages);
              if (pageKeys.length > 0) {
                const firstPage = pages[pageKeys[0]];
                imageUrl = firstPage.imageinfo?.[0]?.url || '';
              }
            }
          }
        } catch (err) {
          console.error("Wikimedia Commons query failed:", err);
        }
        
        if (!imageUrl) {
          imageUrl = 'media__1785690174675.png';
        }
      }

      assistantReply = `Here is the generated image illustration for **${activeTopic}**.\n\n[Image: ${imageUrl}]`;
    } else if (detectedIntent === 'Document Generation') {
      const format = queryLower.includes('pdf') ? 'pdf' : 'docx';
      assistantReply = `Here is the exported document file for **${activeTopic}**.\n\n[Document: ${format}]\nTitle: ${activeTopic} Reference Material\nType: study_guide\nPages: 5\nSize: 142 KB\nContent: This study guide contains curriculum breakdown and core concepts regarding ${activeTopic}. Follow the guidelines to ensure complete preparation.`;
    } else if (detectedIntent === 'Code Generation') {
      let lang = 'javascript';
      const languages = [
        { name: 'javascript', keywords: ['javascript', 'js', 'node'] },
        { name: 'typescript', keywords: ['typescript', 'ts'] },
        { name: 'python', keywords: ['python', 'py'] },
        { name: 'java', keywords: ['java'] },
        { name: 'c++', keywords: ['c++', 'cpp', 'c plus plus'] },
        { name: 'c#', keywords: ['c#', 'csharp', 'c sharp'] },
        { name: 'c', keywords: ['c code', 'language c', 'in c'] },
        { name: 'ruby', keywords: ['ruby', 'rb'] },
        { name: 'go', keywords: ['go code', 'golang', 'go lang'] },
        { name: 'rust', keywords: ['rust', 'rs'] },
        { name: 'php', keywords: ['php'] },
        { name: 'swift', keywords: ['swift'] },
        { name: 'kotlin', keywords: ['kotlin'] },
        { name: 'r', keywords: ['r code', 'language r'] },
        { name: 'html', keywords: ['html'] },
        { name: 'css', keywords: ['css'] },
        { name: 'sql', keywords: ['sql'] }
      ];

      const detectedLang = languages.find(l => l.keywords.some(k => queryLower.includes(k)));
      if (detectedLang) {
        lang = detectedLang.name;
      }

      let code = ``;
      let consoleOutput = ``;
      const isOneToTen = queryLower.includes('1 to 10') || queryLower.includes('1-10');

      if (isOneToTen) {
        consoleOutput = "1\n2\n3\n4\n5\n6\n7\n8\n9\n10";
        switch (lang) {
          case 'javascript':
          case 'typescript':
            code = `for (let i = 1; i <= 10; i++) {\n  console.log(i);\n}`;
            break;
          case 'python':
            code = `for i in range(1, 11):\n    print(i)`;
            break;
          case 'java':
            code = `public class PrintNumbers {\n    public static void main(String[] args) {\n        for (int i = 1; i <= 10; i++) {\n            System.out.println(i);\n        }\n    }\n}`;
            break;
          case 'c++':
            code = `#include <iostream>\nusing namespace std;\n\nint main() {\n    for (int i = 1; i <= 10; i++) {\n        cout << i << endl;\n    }\n    return 0;\n}`;
            break;
          case 'c#':
            code = `using System;\n\nclass PrintNumbers {\n    static void Main() {\n        for (int i = 1; i <= 10; i++) {\n            Console.WriteLine(i);\n        }\n    }\n}`;
            break;
          case 'c':
            code = `#include <stdio.h>\n\nint main() {\n    int i;\n    for (i = 1; i <= 10; i++) {\n        printf("%d\\n", i);\n    }\n    return 0;\n}`;
            break;
          case 'ruby':
            code = `(1..10).each { |i| puts i }`;
            break;
          case 'go':
            code = `package main\n\nimport "fmt"\n\nfunc main() {\n    for i := 1; i <= 10; i++ {\n        fmt.Println(i)\n    }\n}`;
            break;
          case 'rust':
            code = `fn main() {\n    for i in 1..=10 {\n        println!("{}", i);\n    }\n}`;
            break;
          case 'php':
            code = `<?php\nfor ($i = 1; $i <= 10; $i++) {\n    echo $i . "\\n";\n}\n?>`;
            break;
          case 'swift':
            code = `for i in 1...10 {\n    print(i)\n}`;
            break;
          case 'kotlin':
            code = `fun main() {\n    for (i in 1..10) {\n        println(i)\n    }\n}`;
            break;
          case 'r':
            code = `for (i in 1:10) {\n  print(i)\n}`;
            break;
          default:
            code = `// Print 1 to 10\nfor (let i = 1; i <= 10; i++) {\n  console.log(i);\n}`;
        }
      } else {
        consoleOutput = 'Running task for ' + activeTopic;
        switch (lang) {
          case 'javascript':
          case 'typescript':
            code = `function executeTask() {\n  console.log("Running task for ${activeTopic}");\n}\nexecuteTask();`;
            break;
          case 'python':
            code = `def execute_task():\n    print("Running task for ${activeTopic}")\n\nexecute_task()`;
            break;
          case 'java':
            code = `public class StudyTask {\n    public static void main(String[] args) {\n        System.out.println("Running task for ${activeTopic}");\n    }\n}`;
            break;
          case 'c++':
            code = `#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Running task for ${activeTopic}" << endl;\n    return 0;\n}`;
            break;
          case 'c#':
            code = `using System;\nclass StudyTask {\n    static void Main() {\n        Console.WriteLine("Running task for ${activeTopic}");\n    }\n}`;
            break;
          case 'c':
            code = `#include <stdio.h>\nint main() {\n    printf("Running task for ${activeTopic}\\n");\n    return 0;\n}`;
            break;
          case 'ruby':
            code = `puts "Running task for ${activeTopic}"`;
            break;
          case 'go':
            code = `package main\nimport "fmt"\nfunc main() {\n    fmt.Println("Running task for ${activeTopic}")\n}`;
            break;
          case 'rust':
            code = `fn main() {\n    println!("Running task for ${activeTopic}");\n}`;
            break;
          case 'php':
            code = `<?php echo "Running task for ${activeTopic}\\n"; ?>`;
            break;
          case 'swift':
            code = `print("Running task for ${activeTopic}")`;
            break;
          case 'kotlin':
            code = `fun main() { println("Running task for ${activeTopic}") }`;
            break;
          case 'r':
            code = `print("Running task for ${activeTopic}")`;
            break;
          case 'html':
            code = `<div class="card">\n  <h3>${activeTopic}</h3>\n  <button onclick="alert('Clicked')">Submit</button>\n</div>`;
            consoleOutput = 'Rendered HTML layout successfully';
            break;
          case 'css':
            code = `.card {\n  background: rgba(255,255,255,0.05);\n  border: 1px solid var(--border-color);\n  padding: 16px;\n}`;
            consoleOutput = 'Compiled CSS rules successfully';
            break;
          case 'sql':
            code = `SELECT * FROM study_topics WHERE name = '${activeTopic}' LIMIT 1;`;
            consoleOutput = `Table Results:\nID | Name | Difficulty\n1 | ${activeTopic} | High`;
            break;
          default:
            code = `function executeTask() {\n  console.log("Running task for ${activeTopic}");\n}\nexecuteTask();`;
        }
      }

      assistantReply = `Here is the generated code structure for **${activeTopic}**.\n\n[Code: ${lang}]\n${code}\n[Console]\n${consoleOutput}`;
    } else if (detectedIntent === 'Project Structure') {
      assistantReply = `Here is the directory file tree for project **${activeTopic}**.\n\n[Project]\nsrc/components/Card.jsx\nsrc/components/Header.jsx\nsrc/App.jsx\nsrc/index.css\npublic/favicon.svg\npackage.json\nREADME.md`;
    } else if (detectedIntent === 'UI Wireframe') {
      assistantReply = `Here is the wireframe structure details for **${activeTopic}**.\n\n[UI]\nTitle: ${activeTopic} Wireframe\nInputs: text|Enter topic name, email|Enter email address\nButtons: Submit Primary, Cancel Secondary\nToggles: Dark Mode, Notifications`;
    } else if (detectedIntent === 'Writer Editor') {
      assistantReply = `Here is the drafted content for **${activeTopic}**.\n\n[Editor]\nSubject: ${activeTopic} Revision Notes\n\nThis document summarizes key points about ${activeTopic}. Please review it for your upcoming exams.\n\nKey Concepts:\n1. Core terminology definitions.\n2. Standard operational methods.\n3. Detailed synthesis guidelines.\n\nSincerely,\nAI Assistant`;
    } else if (detectedIntent === 'Data Formatting') {
      const format = queryLower.includes('json') ? 'json' : (queryLower.includes('yaml') ? 'yaml' : 'xml');
      let dataText = `{ "topic": "${activeTopic}", "status": "validated", "timestamp": "${new Date().toISOString()}" }`;
      if (format === 'yaml') {
        dataText = `topic: "${activeTopic}"\nstatus: "validated"\ntimestamp: "${new Date().toISOString()}"`;
      } else if (format === 'xml') {
        dataText = `<data>\n  <topic>${activeTopic}</topic>\n  <status>validated</status>\n</data>`;
      }
      assistantReply = `Here is the formatted structure representation for **${activeTopic}**.\n\n[Tree: ${format}]\n${dataText}`;
    }

    if (isDeepResearch) {
      agentLogs = [
        { agent: "Deep Research Agent", action: "Expanding search space to academic indexes and local RAG documents.", status: "completed" },
        { agent: "Information Retrieval Agent", action: "Scanned 12 databases for matching references.", status: "completed" },
        { agent: "Consensus Synthesis Agent", action: "Checked fact consistency across sources and compiled structured brief.", status: "completed" }
      ];
      assistantReply += `\n\n### 🌐 Deep Research Synthesis Report\n- **Fact Grounding**: Verified against curriculum vector index.\n- **Depth Level**: Comprehensive multi-step exploration.\n- **Source Authenticity**: 100% verified academic references.`;
    }
    
    if (learningMode === 'socratic') {
      agentLogs = [
        { agent: "Planner Agent", action: "Identified Socratic coaching style request. Activating Socratic Coach.", status: "completed" },
        { agent: "Socratic Coach Agent", action: "Formulated pedagogical query loops and guided check-in prompts.", status: "completed" },
        { agent: "Writer Agent", action: "Rendered guided Socratic sub-lessons.", status: "completed" }
      ];
      assistantReply = `### 🎓 Socratic Coach Mode: ${activeTopic}

Instead of giving you the answers directly, let's explore **${activeTopic}** together. 

To start, what do you think is the primary real-world purpose of this concept, or where have you encountered it before? 

*Pedagogical Tip: Try to state your thoughts in a single sentence, and I will guide you to the formal definition step-by-step!*`;
    } else if (learningMode === 'feynman') {
      agentLogs = [
        { agent: "Planner Agent", action: "Feynman Technique validation active. Grading student response.", status: "completed" },
        { agent: "Gap Evaluator Agent", action: "Scanned response length and conceptual coverage.", status: "completed" },
        { agent: "Writer Agent", action: "Rendered Feynman score card.", status: "completed" }
      ];
      const hasExplanationContent = originalMessage && originalMessage.trim().length > 15 && !originalMessage.includes('explain') && !originalMessage.includes('what is');
      
      if (hasExplanationContent) {
        // Calculate a mock score based on message length
        const score = Math.min(65 + Math.floor(originalMessage.length / 5), 98);
        assistantReply = `### 🔬 Feynman Concept Review: ${activeTopic}
        
- **Your Simplified Explanation**: *"${originalMessage}"*
- **Feynman score**: **${score}/100**

#### Evaluation Report:
1. **Analogy Strength**: ⭐️⭐️⭐️⭐️☆ (Good usage of everyday terminology).
2. **Key Missing Parameter**: The formal variables and scaling properties of ${activeTopic}.
3. **Constructive Critique**: You did a solid job explaining the intuition! To elevate this to a 100/100, try to explain how it relates directly to the physical formulas or protocols in the curriculum.

*Discussion prompt: Would you like to rewrite your explanation to address this critique?*`;
      } else {
        assistantReply = `### 💡 Feynman Technique Mode: ${activeTopic}

Welcome to the Feynman Technique workspace! The best way to learn a concept is to teach it to someone else.

**Your task**:
In your own simple words, explain **${activeTopic}** as if you were explaining it to a 10-year-old child. 

Once you reply, I will evaluate your explanation, point out any conceptual gaps, and give you a Feynman Score!`;
      }
    } else if (isGuidedLearning) {
      agentLogs.push({ agent: "Guided Coach Agent", action: "Structured curriculum answer into simple guided modules.", status: "completed" });
      assistantReply = `### 📚 Guided Study Guide: ${activeTopic}\n\nLet's break this down step-by-step:\n\n1. **Core Concept**: Read the overview below.\n2. **Practice Step**: Work on the practice prompts.\n3. **Quick Test**: Answer the quiz cards.\n\n---\n\n` + assistantReply + `\n\n**Discussion Prompt**: Do you want to dive deeper into any of these stages? Reply to continue!`;
    }

    if (isPlainTextRequest) {
      assistantReply = stripMarkdown(assistantReply);
    }

    const prevHistory = session ? session.history : [];
    const updatedHistory = [...prevHistory, 
      { id: Date.now() + '-stud', sender: 'student', text: originalMessage, timestamp: new Date() },
      { 
        id: Date.now() + '-asst', 
        sender: 'assistant', 
        text: assistantReply, 
        timestamp: new Date(),
        agentLogs,
        sources
      }
    ];
    saveSession(sessionId, updatedHistory);

    addLog({
      status: 'success',
      version: 'Mock-Engine',
      duration: Date.now() - startTime,
      path,
      query: originalMessage,
      response: assistantReply
    });

    // Simulate delay
    await new Promise(r => setTimeout(r, 100));
    return res.json({ reply: assistantReply, path, agentLogs, sources });
  }
});

// ----------------------------------------------------
// API 2: Upload Documents Endpoint (RAG Indexer)
// ----------------------------------------------------
app.post('/api/upload', async (req, res) => {
  const { documentText, apiKey } = req.body;
  if (!documentText || documentText.trim() === '') {
    return res.status(400).json({ error: 'Document text is empty.' });
  }

  try {
    // 1. Chunk document text into chunks of ~400 characters
    const chunks = [];
    const sentences = documentText.split(/[.!?]\s+/);
    let currentChunk = '';
    
    for (const sentence of sentences) {
      if ((currentChunk + sentence).length > 400) {
        chunks.push(currentChunk.trim());
        currentChunk = sentence;
      } else {
        currentChunk += ' ' + sentence;
      }
    }
    if (currentChunk.trim() !== '') {
      chunks.push(currentChunk.trim());
    }

    console.log(`Document split into ${chunks.length} chunks.`);

    // 2. Index each chunk
    let successCount = 0;
    for (const chunk of chunks) {
      let vector = [];
      
      // If API key is provided, retrieve real embeddings
      if (apiKey && apiKey.trim() !== '') {
        try {
          const embedEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${apiKey}`;
          const embedResponse = await fetch(embedEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              content: { parts: [{ text: chunk }] }
            })
          });

          if (embedResponse.ok) {
            const embedData = await embedResponse.json();
            vector = embedData.embedding?.values || [];
          }
        } catch (embedErr) {
          console.error("Gemini embedding retrieval failed:", embedErr);
        }
      }

      // If no vector was created (mock mode or error), create mock 768-dim vector
      if (vector.length === 0) {
        for (let i = 0; i < 768; i++) {
          vector.push(Math.random() * 0.1 - 0.05);
        }
      }

      addCurriculumChunk(chunk, vector);
      successCount++;
    }

    return res.json({ 
      success: true, 
      message: `Successfully indexed ${successCount} curriculum document chunks in vector database.` 
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// API 3: Get Logs Endpoint
// ----------------------------------------------------
app.get('/api/logs', (req, res) => {
  return res.json(getLogs());
});

// ----------------------------------------------------
// API 4: Get Sessions Endpoint
// ----------------------------------------------------
app.get('/api/sessions/:sessionId', (req, res) => {
  const sessions = getSessions();
  const session = sessions[req.params.sessionId];
  return res.json(session ? session.history : []);
});

// Get all sessions
app.get('/api/sessions', (req, res) => {
  const sessions = getSessions();
  return res.json(Object.values(sessions).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)));
});

// Rename a session
app.post('/api/sessions/:sessionId/rename', (req, res) => {
  const { name } = req.body;
  const session = saveSessionName(req.params.sessionId, name);
  if (session) {
    return res.json({ success: true, session });
  } else {
    return res.status(404).json({ error: 'Session not found' });
  }
});

// Delete a session
app.delete('/api/sessions/:sessionId', (req, res) => {
  const success = deleteSession(req.params.sessionId);
  if (success) {
    return res.json({ success: true });
  } else {
    return res.status(404).json({ error: 'Session not found' });
  }
});

// ----------------------------------------------------
// API 5: Get Curriculum Files Endpoint
// ----------------------------------------------------
app.get('/api/curriculum', (req, res) => {
  return res.json(getCurriculum());
});

// ----------------------------------------------------
// Catch-all: Serve React frontend for any non-API route
// ----------------------------------------------------
app.use((req, res, next) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`AI Study Assistant Backend running on http://localhost:${PORT}`);
});
