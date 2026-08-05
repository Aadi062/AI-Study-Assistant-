# AI Agent - Features & Functions Walkthrough

Every feature and function from the system diagram has been successfully mapped to a working, interactive component. Here is a guide on how to trigger and verify each of them:

---

## 🛠️ Verification Prompt Guide

### 1. Intent Recognition & AI Routing
- **Prompt**: any prompt below.
- **Verification**: The top badge inside the chat bubble shows the classified Intent and routed Tool.

### 2. Image Generation
- **Prompt**: `"show me a picture of photosynthesis"` or `"draw a modified car"`
- **Verification**: Queries Wikimedia Commons dynamically and renders a real-world image card.

### 3. Diagram & Flowchart Generation (Mermaid)
- **Prompt**: `"create a flowchart of login system"`
- **Verification**: Renders a live, interactive SVG node diagram.

### 4. Code Generation & Sandbox Execution
- **Prompt**: `"given python code 1 to 10"` or `"write html code"`
- **Verification**: Renders a stacked sandbox view. Modify the input limit or text, click **Run Code**, and watch the loop parameters and console logs update dynamically.

### 5. Presentation (PPT) Generation
- **Prompt**: `"create a ppt on database systems"`
- **Verification**: Renders a paginated slide deck carousel.

### 6. Document Generation (PDF/DOCX)
- **Prompt**: `"generate a pdf study guide"` or `"create a word document on computer network"`
- **Verification**: Renders a document file card. Clicking the **Download** button builds and saves a file locally.

### 7. Spreadsheet & Data Export (Excel/CSV)
- **Prompt**: `"create an excel sheet of student grades"` or `"generate csv of task lists"`
- **Verification**: Renders a tabular data grid spreadsheet.

### 8. UI, Wireframe & Schema Design
- **Prompt**: `"wireframe a login page"` or `"create an erd schema for ecommerce"`
- **Verification**: Renders functional form cards (input fields, switches, buttons) or database primary/foreign keys.

### 9. Content Generation (Emails, Blogs, Resumes)
- **Prompt**: `"write an email to professor"` or `"create a resume for developer"`
- **Verification**: Renders a typewriter-styled sheet showing live word counters.

### 10. Language Translation & Summarization
- **Prompt**: `"translate hello to spanish"` or `"summarize the feynman technique"`
- **Verification**: Renders summaries inside the writer editor layout.

### 11. Quiz & MCQ Generation
- **Prompt**: `"give me a quiz on cell biology"`
- **Verification**: Renders an interactive multiple-choice quiz selector with final grading results.

### 12. Project Structure Planners
- **Prompt**: `"generate project structure for react app"`
- **Verification**: Renders an interactive directory explorer directory tree.

### 13. Planners & Roadmaps
- **Prompt**: `"create a roadmap on web development"`
- **Verification**: Renders a checkbox roadmap.
