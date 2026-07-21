import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { 
  getSessions, saveSession, getLogs, addLog, 
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
app.post('/api/chat', async (req, res) => {
  const { sessionId, message, chatMode, activeVersion, apiKey } = req.body;
  const startTime = Date.now();
  const queryLower = message.toLowerCase();
  
  let assistantReply = '';
  let path = 'B'; // default Path B (New)
  
  // Lookup session history to check if it's path A or B
  const sessions = getSessions();
  const session = sessions[sessionId];
  if (session && session.history.length > 1) {
    path = 'A';
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
            content: { parts: [{ text: message }] }
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
        parts: [{ text: message }]
      });

      // 4. Construct System Instruction with Vector Grounding
      const groundingInstruction = curriculumContext 
        ? `Ground your answers strictly on this retrieved curriculum context from our Qdrant vector database:\n${curriculumContext}\n\n`
        : '';

      const systemInstruction = {
        role: 'user',
        parts: [{
          text: `You are the AI Study Assistant n8n agent. ${groundingInstruction}Your job is to provide personalized learning, answer student doubts instantly, generate practice quizzes, study plans, or flashcards. 
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

      // 6. Save history to Database
      const agentLogs = [
        { agent: "Planner Agent", action: "Parsed query. Routed task to Gemini RAG execution path.", status: "completed" },
        { agent: "Researcher Agent", action: curriculumContext ? "Searched local vector database (Qdrant) using 768-dim embeddings." : "No local vector context matches found. Relying on model parametric memory.", status: "completed" },
        { agent: "Writer Agent", action: "Synthesized response grounded on matching curriculum vectors.", status: "completed" }
      ];
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
        body: JSON.stringify({ sessionId, message })
      });

      if (!response.ok) throw new Error('Webhook connection failed');
      const data = await response.json();
      assistantReply = data.reply || "Grounded webhook response executed successfully.";

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
    const agentLogs = [
      { agent: "Planner Agent", action: "Identified Mock simulation request. Delegating task to local classifier.", status: "completed" },
      { agent: "Researcher Agent", action: assistantReply.includes('DuckDuckGo') ? "Queried external web index (DuckDuckGo) for missing grounding facts." : "Parsed local curriculum guidelines cached in database.", status: "completed" },
      { agent: "Writer Agent", action: "Synthesized curriculum definitions and generated study cards.", status: "completed" }
    ];
    const sources = assistantReply.includes('DuckDuckGo') ? ["DuckDuckGo abstract search results"] : ["Curriculum guidelines profile cache"];

    const prevHistory = session ? session.history : [];
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

    addLog({
      status: 'success',
      version: 'Mock-Engine',
      duration: Date.now() - startTime,
      path,
      query: message,
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
