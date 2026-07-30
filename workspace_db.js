import fs from 'fs';
import path from 'path';

const DATA_DIR = path.resolve('./database_workspace');

// Ensure database directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');
const CURRICULUM_FILE = path.join(DATA_DIR, 'curriculum.json');
const LOGS_FILE = path.join(DATA_DIR, 'logs.json');

// Helper to load file safely
const readJsonFile = (filePath, defaultVal = []) => {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaultVal, null, 2));
    return defaultVal;
  }
  try {
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
    return defaultVal;
  }
};

const writeJsonFile = (filePath, data) => {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};

// ----------------------------------------------------
// DB APIs
// ----------------------------------------------------
export const getSessions = () => readJsonFile(SESSIONS_FILE, {});
export const saveSession = (sessionId, history, name = null) => {
  const sessions = getSessions();
  const existing = sessions[sessionId];
  sessions[sessionId] = {
    sessionId,
    history,
    name: name || (existing && existing.name) || `Thread ${Object.keys(sessions).length + 1}`,
    updatedAt: new Date()
  };
  writeJsonFile(SESSIONS_FILE, sessions);
  return sessions[sessionId];
};

export const saveSessionName = (sessionId, name) => {
  const sessions = getSessions();
  if (sessions[sessionId]) {
    sessions[sessionId].name = name;
    sessions[sessionId].updatedAt = new Date();
    writeJsonFile(SESSIONS_FILE, sessions);
    return sessions[sessionId];
  }
  return null;
};

export const getLogs = () => readJsonFile(LOGS_FILE, []);
export const addLog = (logEntry) => {
  const logs = getLogs();
  logs.unshift({
    id: 'log-' + Math.random().toString(16).substring(2, 10),
    timestamp: new Date(),
    ...logEntry
  });
  writeJsonFile(LOGS_FILE, logs);
};

export const getCurriculum = () => readJsonFile(CURRICULUM_FILE, []);
export const addCurriculumChunk = (text, vector) => {
  const curriculum = getCurriculum();
  curriculum.push({
    id: 'chunk-' + Math.random().toString(16).substring(2, 10),
    text,
    vector
  });
  writeJsonFile(CURRICULUM_FILE, curriculum);
};

// Cosine Similarity calculation
export const cosineSimilarity = (vecA, vecB) => {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

// Query Qdrant-like vector search locally
export const queryVectorDB = (queryVector, limit = 3) => {
  const curriculum = getCurriculum();
  if (curriculum.length === 0 || !queryVector) return [];

  const scored = curriculum.map(chunk => ({
    text: chunk.text,
    score: cosineSimilarity(queryVector, chunk.vector)
  }));

  // Sort by highest score first
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
};

// Initialize Mock database with default curriculum chunks and default chat threads if empty
const initDefaultData = () => {
  const curriculum = getCurriculum();
  if (curriculum.length === 0) {
    console.log("Initializing database with default curriculum vectors...");
    
    // Create mock 768-dimension vectors for Gemini Embeddings
    const createMockVector = () => {
      const vec = [];
      for (let i = 0; i < 768; i++) {
        vec.push(Math.random() * 0.1 - 0.05);
      }
      return vec;
    };

    const mockChunks = [
      "Photosynthesis is the key process in plant biology where green leaves use chlorophyll to absorb sunlight. The light reactions convert water and carbon dioxide into glucose and release oxygen.",
      "Newton's Second Law of Motion defines that the net force applied to a mass is directly proportional to its acceleration, modeled as F = ma, where force is in Newtons, mass in kg, and acceleration in m/s².",
      "Cell biology explores organelles like the Mitochondria, the powerhouse that converts glucose into ATP energy, and Ribosomes, which synthesize proteins from RNA guidelines.",
      "Water (H2O) is a polar covalent compound. Electronegativity shifts create hydrogen bonding between water molecules, giving it high specific heat and surface tension, working as the universal solvent."
    ];

    mockChunks.forEach(text => {
      addCurriculumChunk(text, createMockVector());
    });
  }

  // Pre-populate chat history threads from ChatGPT user profile screenshot
  const sessions = getSessions();
  const defaultThreads = [
    { id: 'red-dress', name: 'Red dress query', query: 'Help me find a red dress matching blue shoes' },
    { id: 'sentence-corr', name: 'Sentence correction', query: 'Correct the sentence: she do not like apples' },
    { id: 'db-concepts', name: 'Database Concepts and ERD', query: 'Explain 3NF Normalization and draw an ERD for school management system' },
    { id: 'soft-eng-ans', name: 'Short Software Engineering Answers', query: 'Explain the difference between Agile and Waterfall models' },
    { id: 'prompt-eng', name: 'Prompt Engineering Iterations', query: 'How do I write a prompt to summarize text in 3 bullet points?' },
    { id: 'ai-tech-prog', name: 'AI Technology Progression', query: 'Brief timeline of transformer architectures from 2017 to 2026' },
    { id: 'ai-agent-roadmap', name: 'AI Agent Roadmap', query: 'What is the roadmap to build autonomous multi-agent coding assistants?' },
    { id: 'pdf-to-ppt', name: 'Convert PDF to PPT', query: 'What python script can convert PDF slides to PowerPoint PPTX?' },
    { id: 'render-plan-issue', name: 'Render Free Plan Issue', query: 'Why does my Render service take 50 seconds to boot on free tier?' },
    { id: 'ai-agent-arch', name: 'AI Agent System Architecture', query: 'Design an architecture with a Planner, Executor, and Critic' },
    { id: 'card-troubleshoot', name: 'Card Addition Troubleshooting', query: 'Fixing React map key index warnings when adding dashboard cards' },
    { id: 'fullstack-db-work', name: 'Frontend Backend Database Work', query: 'How to connect my Express API server to a PostgreSQL container?' },
    { id: 'fullstack-data', name: 'Frontend Backend Data', query: 'How to serialize JSON data dynamically from my SQL queries?' }
  ];

  let hasChanges = false;
  defaultThreads.forEach((t, index) => {
    const sessKey = `session-default-${index + 1}`;
    if (!sessions[sessKey]) {
      hasChanges = true;
      
      let replyText = '';
      if (t.id === 'red-dress') {
        replyText = `### Styling Guide: Red Dress & Blue Shoes

Pairing a **Red Dress** with **Blue Shoes** creates a bold, complementary color block outfit. 

*   **Primary Rule**: Use a primary split-complementary color scheme. Red and blue sit opposite to each other near yellow-green on the color wheel.
*   **Color Balances**: Opt for a deep royal blue or navy shoe to anchor a bright scarlet dress, or pair a cobalt shoe with a cherry-red dress.
*   **Accessories**: Keep other accessories neutral (nude, silver, or gold) to let the red-blue contrast stand out.`;
      } else if (t.id === 'sentence-corr') {
        replyText = `### Grammar Guide: Subject-Verb Agreement

The sentence *"she do not like apples"* contains a subject-verb agreement error.

*   **Correction**: *"She does not like apples"* (or contraction: *"She doesn't like apples"*).
*   **Grammar Rule**: Third-person singular subjects (*he, she, it*) require the singular verb form **does** in negative statements, rather than the plural auxiliary **do**.`;
      } else if (t.id === 'db-concepts') {
        replyText = `### Database Guide: Normalization (3NF)

A relational database table is in **Third Normal Form (3NF)** if it is in 2NF and contains no transitive dependencies.

*   **2NF Condition**: In 2NF, all non-key attributes are fully functional dependent on the primary key.
*   **Transitive Dependency Rule**: Non-key attributes must not depend on other non-key attributes. (They must depend *\"only on the key, the whole key, and nothing but the key\"*).`;
      } else if (t.id === 'soft-eng-ans') {
        replyText = `### Software Engineering: Agile vs Waterfall

*   **Agile**: Iterative and incremental development. Requirements and solutions evolve through collaboration. Ideal for projects with high uncertainty or changing requirements.
*   **Waterfall**: Linear and sequential lifecycle. Each phase (requirements, design, implementation, verification, maintenance) must be completed before the next begins. Ideal for stable, well-understood systems.`;
      } else if (t.id === 'prompt-eng') {
        replyText = `### Prompt Engineering Tip

To enforce structured summary outputs, explicitly state constraints:
1.  Define the source text clearly.
2.  Provide output schema constraints (e.g., *"Summarize in exactly 3 bullet points, maximum 15 words per bullet"*).
3.  Include a negative constraint (e.g., *"Do not use introductory sentences like 'Here is the summary'"*).`;
      } else if (t.id === 'ai-tech-prog') {
        replyText = `### AI Technology Progression (2017 - 2026)

*   **2017**: Transformer architecture introduced (*Attention Is All You Need*).
*   **2018 - 2020**: Scaling laws defined (GPT-2, GPT-3, BERT, RoBERTa).
*   **2021 - 2023**: Multimodality (GPT-4V, Gemini 1.0, DALL-E 3).
*   **2024 - 2026**: Reasoning and Agentic Workflows (Gemini 2.5, Groq Llama-3.3, real-time tool use).`;
      } else if (t.id === 'ai-agent-roadmap') {
        replyText = `### Autonomous Coding Agent Roadmap

1.  **Level 1: Chat Assistant** (Vite + LangChain / LLM API relays).
2.  **Level 2: RAG Integration** (Grounding assistant replies in codebases or documentation).
3.  **Level 3: Multi-Agent Choreography** (Routing specialized Planner, Researcher, and Editor agents).
4.  **Level 4: Tool-Use & Verification** (Running unit tests, code compiler feedback loops in secure environments).`;
      } else if (t.id === 'pdf-to-ppt') {
        replyText = `### Python: PDF to PowerPoint Slides

To convert PDF pages into PowerPoint slides, use \`python-pptx\` along with \`pdfplumber\` or \`fitz\`:

1.  Extract text/images from the PDF using fitz (PyMuPDF).
2.  Create slide sheets using \`Presentation()\` from \`pptx\`.
3.  Add text frames and picture layers onto each slide dynamically.`;
      } else if (t.id === 'render-plan-issue') {
        replyText = `### Deployment: Render Free Tier Cold Starts

On Render's free tier plans, web service containers are automatically spun down (suspended) after 15 minutes of inactivity.

*   **Cold Start Latency**: The next incoming request triggers a spin-up, which takes between 50 and 90 seconds.
*   **Fixes**: Upgrade to Render's starter plan ($7/mo) or use a cron ping service to hit your endpoint every 14 minutes.`;
      } else if (t.id === 'ai-agent-arch') {
        replyText = `### System Architecture: Planner-Executor-Critic

*   **Planner**: Decomposes the user request into a step-by-step implementation plan (e.g. \`implementation_plan.md\`).
*   **Executor**: Modifies source files and runs shell commands based on plan steps.
*   **Critic**: Runs verification tests and inspects file diffs to suggest fixes.`;
      } else if (t.id === 'card-troubleshoot') {
        replyText = `### React: Unique Key Prop Warnings

In React, rendering list elements inside a loop requires a unique \`key\` prop for optimal DOM reconciliation:

*   **Fix**: Add a distinct string ID (like \`session.sessionId\`) as key instead of using array indexes.
*   **Avoid**: Avoid using \`Math.random()\` inside key declarations, as it forces unnecessary redraws.`;
      } else if (t.id === 'fullstack-db-work') {
        replyText = `### DevOps: Connecting Express to PostgreSQL

1.  Define a Postgres service inside \`docker-compose.yml\`.
2.  Install database drivers (\`pg\` npm package) in your Express API server.
3.  Utilize connection pools (\`pg.Pool\`) and verify startup delays (e.g. using \`pg-ready\` wait helpers).`;
      } else {
        replyText = `### Node.js: JSON Serialization & Parsing

Use \`JSON.stringify(data, null, 2)\` to pretty-print data to disk files, and \`JSON.parse(text)\` to load files back into objects. Ensure you enclose operations in \`try-catch\` blocks to prevent runtime parser crashes.`;
      }

      const history = [
        {
          id: 'welcome-' + index,
          sender: 'assistant',
          text: `Hello! Let's study and chat about **${t.name}**!`,
          timestamp: new Date(Date.now() - (13 - index) * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'query-' + index,
          sender: 'student',
          text: t.query,
          timestamp: new Date(Date.now() - (13 - index) * 60 * 60 * 1000 + 30000).toISOString()
        },
        {
          id: 'reply-' + index,
          sender: 'assistant',
          text: replyText,
          timestamp: new Date(Date.now() - (13 - index) * 60 * 60 * 1000 + 40000).toISOString(),
          agentLogs: [
            { agent: "Planner Agent", action: "Parsed mock query", status: "completed" },
            { agent: "Researcher Agent", action: "Retrieved local answer profile", status: "completed" }
          ],
          sources: ["Curriculum guidelines profile cache"]
        }
      ];

      sessions[sessKey] = {
        sessionId: sessKey,
        history,
        name: t.name,
        updatedAt: new Date(Date.now() - (13 - index) * 60 * 60 * 1000).toISOString()
      };
    }
  });

  if (hasChanges) {
    console.log("Writing default chat threads to sessions database...");
    writeJsonFile(SESSIONS_FILE, sessions);
  }
};

initDefaultData();
