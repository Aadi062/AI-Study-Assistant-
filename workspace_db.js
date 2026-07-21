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
export const saveSession = (sessionId, history) => {
  const sessions = getSessions();
  sessions[sessionId] = {
    sessionId,
    history,
    updatedAt: new Date()
  };
  writeJsonFile(SESSIONS_FILE, sessions);
  return sessions[sessionId];
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

// Initialize Mock database with default curriculum chunks if empty
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
};

initDefaultData();
