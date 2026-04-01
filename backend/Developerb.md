👨‍💻 DEVELOPER B - BACKEND/AI LEAD
HOUR 1: AI Architecture (0:00 - 1:00)
✅ Task 1.1: Claude API Setup (15 min)
services/claude.js:
javascriptconst ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY;

export const callClaude = async ({
  system,
  messages,
  tools = [],
  maxTokens = 2000
}) => {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: maxTokens,
      system,
      messages,
      tools
    })
  });
  
  return await response.json();
};
Deliverables:

 API wrapper function
 Error handling
 Token usage tracking
 Environment variable setup


✅ Task 1.2: Conversation Manager (20 min)
services/conversationManager.js:
javascriptclass ConversationManager {
  constructor() {
    this.history = [];
    this.currentAgent = null;
    this.totalTokens = 0;
  }
  
  addUserMessage(content) {
    this.history.push({
      role: 'user',
      content,
      timestamp: Date.now()
    });
  }
  
  addAgentMessage(agent, content, tokens) {
    this.history.push({
      role: 'assistant',
      content,
      metadata: {
        agent,
        tokens,
        timestamp: Date.now()
      }
    });
    this.totalTokens += tokens;
  }
  
  getHistory() {
    return this.history;
  }
  
  exportForClaude() {
    // Format for Claude API (remove metadata)
    return this.history.map(msg => ({
      role: msg.role,
      content: msg.content
    }));
  }
  
  saveToLocalStorage(decisionId) {
    localStorage.setItem(
      `decision_${decisionId}`,
      JSON.stringify({
        history: this.history,
        totalTokens: this.totalTokens,
        timestamp: Date.now()
      })
    );
  }
}
Deliverables:

 Conversation state management
 History tracking
 localStorage integration
 Export/import functionality


✅ Task 1.3: Agent System Architecture (25 min)
agents/agentOrchestrator.js:
javascriptimport { callClaude } from '../services/claude.js';
import { agentPrompts } from './agentPrompts.js';

export class AgentOrchestrator {
  constructor(conversationManager, onProgress) {
    this.conversation = conversationManager;
    this.onProgress = onProgress; // Callback for UI updates
  }
  
  async runWorkflow(userInput) {
    // Add user input to history
    this.conversation.addUserMessage(userInput);
    
    // Sequential agent execution
    const agents = [
      'breakdown',
      'research',
      'framework',
      'redTeam',
      'synthesis'
    ];
    
    for (const agentName of agents) {
      await this.executeAgent(agentName);
    }
  }
  
  async executeAgent(agentName) {
    // Update UI: Agent starting
    this.onProgress({ agent: agentName, status: 'running' });
    
    // Prepare context
    const systemPrompt = agentPrompts[agentName];
    const messages = this.conversation.exportForClaude();
    
    // Add agent-specific instruction
    messages.push({
      role: 'user',
      content: this.getAgentInstruction(agentName)
    });
    
    // Call Claude
    const tools = agentName === 'research' 
      ? [{ type: "web_search_20250305", name: "web_search" }]
      : [];
    
    const response = await callClaude({
      system: systemPrompt,
      messages,
      tools
    });
    
    // Extract content (handle tool use)
    const content = this.extractContent(response);
    const tokens = response.usage.input_tokens + response.usage.output_tokens;
    
    // Add to conversation history
    this.conversation.addAgentMessage(agentName, content, tokens);
    
    // Update UI: Agent complete
    this.onProgress({ 
      agent: agentName, 
      status: 'complete',
      tokens 
    });
  }
  
  getAgentInstruction(agentName) {
    const instructions = {
      breakdown: "Break down this decision into key sub-decisions and factors.",
      research: "Research relevant data, trends, and case studies using web search.",
      framework: "Apply decision frameworks (SWOT, Pre-mortem, etc.) to analyze this.",
      redTeam: "Challenge the reasoning above. Find flaws, risks, and counter-arguments.",
      synthesis: "Synthesize all analysis into final recommendation with Mermaid flowchart."
    };
    return instructions[agentName];
  }
  
  extractContent(response) {
    // Handle tool use responses
    return response.content
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join('\n');
  }
}
Deliverables:

 Agent orchestration system
 Sequential execution with context
 Progress callbacks for UI
 Tool use handling


HOUR 2: Agent Intelligence (1:00 - 2:00)
✅ Task 2.1: Agent System Prompts (20 min)
agents/agentPrompts.js:
javascriptexport const agentPrompts = {
  
  breakdown: `You are a Decision Breakdown Specialist.

Your role:
1. Analyze the user's decision
2. Identify 3-5 key sub-decisions or factors
3. Categorize them (financial, emotional, practical, etc.)
4. Flag any missing information needed

Output format:
- Clear list of sub-decisions
- Brief explanation of each
- Questions that need answering

Be concise. Focus on structure.`,

  research: `You are a Research Analyst with web search capabilities.

Your role:
1. Use web search to find relevant data
2. Look for similar case studies
3. Find current trends and statistics
4. Identify expert opinions

Search for:
- Recent news/articles
- Statistical data
- Success/failure stories
- Expert analysis

Cite sources. Be factual.`,

  framework: `You are a Strategic Framework Expert.

Apply these frameworks:
1. SWOT Analysis (Strengths, Weaknesses, Opportunities, Threats)
2. Pre-mortem Analysis (imagine it failed - why?)
3. Second-Order Thinking (long-term consequences)
4. Eisenhower Matrix (urgent vs important)

For each framework:
- Apply it to the decision
- Extract insights
- Rate confidence (0-100%)

Be analytical. Show your work.`,

  redTeam: `You are a Red Team Agent - Devil's Advocate.

Your role is to CHALLENGE the decision aggressively:
1. Find logical flaws
2. Identify hidden risks
3. Question assumptions
4. Present worst-case scenarios
5. Suggest what could go wrong

Be critical but constructive. Your job is to stress-test the reasoning.

Find the weaknesses others miss.`,

  synthesis: `You are a Decision Synthesis Expert.

Your role:
1. Review ALL previous agent outputs
2. Weigh pros vs cons
3. Calculate confidence score (0-100%)
4. Assess risk level (low/medium/high)
5. Provide final recommendation

CRITICAL: Generate a Mermaid flowchart showing:
- Main decision at top
- Key branches (options)
- Sub-decisions under each
- Risk colors: %%{init: {'theme':'base', 'themeVariables': { 'primaryColor':'#22c55e'}}}%% for low risk, '#ef4444' for high risk
- Confidence percentages

Format:
\`\`\`mermaid
graph TD
  A[Decision] --> B[Option 1<br/>Confidence: 75%]
  A --> C[Option 2<br/>Confidence: 45%]
  B --> D[Sub-factor 1]
  style B fill:#22c55e
  style C fill:#ef4444
\`\`\`

Then provide clear recommendation with rationale.`
};
Deliverables:

 5 specialized system prompts
 Clear output formatting
 Mermaid syntax in synthesis
 Risk scoring logic


✅ Task 2.2: Interactive Refinement System (25 min)
services/interactionHandler.js:
javascriptexport class InteractionHandler {
  constructor(orchestrator) {
    this.orchestrator = orchestrator;
  }
  
  async handleUserRefinement(agentName, userFeedback) {
    // User clicked "Refine" after an agent
    // Re-run that specific agent with feedback
    
    this.orchestrator.conversation.addUserMessage(
      `Regarding the ${agentName} agent's output: ${userFeedback}`
    );
    
    await this.orchestrator.executeAgent(agentName);
  }
  
  async handleNodeClick(nodeId, flowchartData) {
    // User clicked a node in flowchart
    // Request detailed reasoning for that specific branch
    
    const prompt = `Explain the detailed reasoning behind the "${nodeId}" decision branch. Include:
    - Why this option scored ${flowchartData.confidence}%
    - Key risks and opportunities
    - What would change the recommendation`;
    
    this.orchestrator.conversation.addUserMessage(prompt);
    
    // Use a specialized "explainer" agent
    return await this.orchestrator.executeAgent('explainer');
  }
  
  async handleScenarioSimulation(scenario) {
    // "What if X happens?" simulation
    
    const prompt = `Simulate scenario: ${scenario}. 
    How would this change the decision? 
    Provide updated flowchart with new probabilities.`;
    
    this.orchestrator.conversation.addUserMessage(prompt);
    
    // Re-run synthesis with new context
    return await this.orchestrator.executeAgent('synthesis');
  }
  
  async handleComparison(option1, option2) {
    // Side-by-side comparison mode
    
    const prompt = `Compare these two options side-by-side:
    Option A: ${option1}
    Option B: ${option2}
    
    Create two separate flowcharts and highlight key differences.`;
    
    this.orchestrator.conversation.addUserMessage(prompt);
    
    return await this.orchestrator.executeAgent('comparison');
  }
}
Deliverables:

 Refinement logic
 Node click handling
 Scenario simulation
 Comparison mode


✅ Task 2.3: Web Search Integration (15 min)
Handle tool use responses:
javascript// In agentOrchestrator.js

extractContent(response) {
  let textContent = '';
  let toolResults = '';
  
  for (const block of response.content) {
    if (block.type === 'text') {
      textContent += block.text + '\n';
    }
    
    // Handle web search results
    if (block.type === 'tool_use' && block.name === 'web_search') {
      toolResults += `\n[Searching: ${block.input.query}]\n`;
    }
  }
  
  return textContent + toolResults;
}

// Ensure research agent can use web search
async executeAgent(agentName) {
  const tools = agentName === 'research' 
    ? [{
        type: "web_search_20250305",
        name: "web_search"
      }]
    : [];
  
  const response = await callClaude({
    system: agentPrompts[agentName],
    messages: this.conversation.exportForClaude(),
    tools
  });
  
  // ... rest of execution
}
Deliverables:

 Web search tool integration
 Tool response parsing
 Search results formatting


HOUR 3: Advanced Features (2:00 - 3:00)
✅ Task 3.1: Confidence & Risk Scoring (20 min)
utils/scoring.js:
javascriptexport const calculateConfidence = (agentOutputs) => {
  // Parse agent outputs for confidence indicators
  
  const factors = {
    dataQuality: assessDataQuality(agentOutputs.research),
    logicalConsistency: assessLogic(agentOutputs.framework),
    riskLevel: assessRisk(agentOutputs.redTeam),
    consensusStrength: assessConsensus(agentOutputs)
  };
  
  // Weighted average
  const confidence = 
    factors.dataQuality * 0.3 +
    factors.logicalConsistency * 0.3 +
    (1 - factors.riskLevel) * 0.2 +
    factors.consensusStrength * 0.2;
  
  return Math.round(confidence * 100);
};

export const assessRiskLevel = (redTeamOutput) => {
  // Count risk indicators in red team output
  const riskKeywords = [
    'danger', 'risk', 'threat', 'warning',
    'fail', 'loss', 'downside', 'concern'
  ];
  
  const count = riskKeywords.reduce((sum, keyword) =>
    sum + (redTeamOutput.toLowerCase().match(new RegExp(keyword, 'g')) || []).length,
    0
  );
  
  if (count > 15) return 'high';
  if (count > 7) return 'medium';
  return 'low';
};

export const generateHeatMap = (flowchartNodes) => {
  // Assign colors based on risk/confidence
  return flowchartNodes.map(node => ({
    ...node,
    color: node.confidence > 70 ? '#22c55e' : // green
           node.confidence > 40 ? '#eab308' : // yellow
           '#ef4444' // red
  }));
};
Deliverables:

 Confidence calculation algorithm
 Risk level assessment
 Heat map color generation


✅ Task 3.2: Timeline View Logic (15 min)
utils/timelineAnalysis.js:
javascriptexport const generateTimelineImpact = async (decision, conversationHistory) => {
  // Ask Claude to analyze short-term vs long-term
  
  const prompt = `Based on the decision analysis:
  
  Provide impact timeline:
  1. Immediate (0-3 months)
  2. Short-term (3-12 months)
  3. Medium-term (1-3 years)
  4. Long-term (3+ years)
  
  For each timeframe:
  - Key impacts (positive and negative)
  - Probability of outcomes
  - Mitigation strategies
  
  Format as JSON:
  {
    "immediate": { "impacts": [...], "probability": "high" },
    "shortTerm": { ... },
    ...
  }`;
  
  const response = await callClaude({
    system: "You are a timeline analysis expert.",
    messages: [...conversationHistory, { role: 'user', content: prompt }]
  });
  
  return JSON.parse(extractJSON(response.content[0].text));
};
Deliverables:

 Timeline impact analysis
 Multi-timeframe breakdown
 JSON output parsing


✅ Task 3.3: Demo Data & Testing (25 min)
Mock responses for fast demo:
javascript// services/demoMode.js

export const demoResponses = {
  gapYear: {
    breakdown: `Key sub-decisions:
    1. Financial: Can I afford 12 months without income?
    2. Career: Will this hurt my job prospects?
    3. Personal: Am I mature enough to benefit?
    4. Academic: Will I lose momentum?
    5. Experience: What specific goals do I have?`,
    
    research: `Web Search Results:
    - 90% of gap year students report increased maturity
    - Average cost: $8,000-$15,000 for international travel
    - Top employers (Google, McKinsey) value gap year experiences
    - Risk: 20% struggle to re-enter academic mindset`,
    
    framework: `SWOT Analysis:
    Strengths: Self-discovery, real-world experience
    Weaknesses: Lost academic momentum, financial cost
    Opportunities: Networking, skill development
    Threats: Peer advancement, parental pressure
    
    Confidence: 68%`,
    
    redTeam: `RED TEAM CHALLENGES:
    1. "Find yourself" is vague - what's the actual plan?
    2. Financial risk if no savings buffer
    3. FOMO watching peers graduate
    4. May just be procrastination disguised as growth
    5. Competitive job market won't wait`,
    
    synthesis: `RECOMMENDATION: Conditional Yes (72% confidence)

\`\`\`mermaid
graph TD
    A[Gap Year Decision] --> B[Take Gap Year<br/>Confidence: 72%]
    A --> C[Continue Studies<br/>Confidence: 58%]
    B --> D[With Structured Plan<br/>Risk: Low]
    B --> E[Without Plan<br/>Risk: High]
    C --> F[Miss Growth Opportunity]
    style B fill:#22c55e
    style D fill:#22c55e
    style E fill:#ef4444
    style C fill:#eab308
\`\`\``
  }
  
  // Add founder and professional scenarios
};

// Fast demo mode toggle
export const useDemoMode = (scenario) => {
  if (import.meta.env.DEV && scenario) {
    return demoResponses[scenario];
  }
  return null;
};
Integration testing:
javascript// Test full workflow
const testWorkflow = async () => {
  const conversation = new ConversationManager();
  const orchestrator = new AgentOrchestrator(
    conversation,
    (progress) => console.log(progress)
  );
  
  await orchestrator.runWorkflow(
    "Should I take a gap year?"
  );
  
  console.log('Total tokens:', conversation.totalTokens);
  console.log('History length:', conversation.history.length);
};
Deliverables:

 3 complete demo scenarios
 Fast demo mode option
 End-to-end testing
 Token usage validation


🔗 Integration Points (Both Developers)
State Management Bridge
App.jsx (Main orchestration):
javascriptimport { useState, useCallback } from 'react';
import { ConversationManager } from './services/conversationManager';
import { AgentOrchestrator } from './agents/agentOrchestrator';

function App() {
  const [conversation] = useState(() => new ConversationManager());
  const [agentStatus, setAgentStatus] = useState({});
  const [messages, setMessages] = useState([]);
  
  const orchestrator = new AgentOrchestrator(
    conversation,
    (progress) => {
      // Update UI when agent status changes
      setAgentStatus(prev => ({
        ...prev,
        [progress.agent]: progress
      }));
    }
  );
  
  const handleUserInput = async (input) => {
    await orchestrator.runWorkflow(input);
    setMessages(conversation.getHistory());
  };
  
  const handleRefinement = async (agent, feedback) => {
    const handler = new InteractionHandler(orchestrator);
    await handler.handleUserRefinement(agent, feedback);
    setMessages(conversation.getHistory());
  };
  
  return (
    <MainLayout>
      <ChatInterface 
        messages={messages}
        onSend={handleUserInput}
        onRefine={handleRefinement}
      />
      <AgentProgress status={agentStatus} />
    </MainLayout>
  );
}

📊 Task Division Summary
TimeDeveloper A (Frontend)Developer B (Backend/AI)0:00-1:00Project setup, UI components, Chat interfaceClaude API setup, Conversation manager, Agent architecture1:00-2:00Flowchart viewer, Agent progress, Voice inputAgent prompts, Interactive refinement, Web search integration2:00-3:00Comparison mode, Timeline UI, PWA, Demo prepConfidence scoring, Timeline logic, Demo data, Testing

ADD AS DEVELOPER.MD 