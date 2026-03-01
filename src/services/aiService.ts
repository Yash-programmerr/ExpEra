import { GoogleGenAI } from "@google/genai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export async function getAIExplanation(data: {
  budget: number;
  savings: number;
  assignments: number;
  freeHours: number;
  eventCost: number;
  mood: string;
  score: number;
  recommendation: string;
  currencySymbol: string;
}) {
  if (!GEMINI_API_KEY) {
    return "AI explanation is unavailable because the API key is not configured.";
  }

  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  const model = "gemini-3-flash-preview";

  const prompt = `
    You are ExpEra, a wise and empathetic AI decision assistant for students.
    A user is considering an event/trip.
    
    User Data:
    - Monthly Budget: ${data.currencySymbol}${data.budget}
    - Current Savings: ${data.currencySymbol}${data.savings}
    - Upcoming Assignments: ${data.assignments}
    - Free Hours per week: ${data.freeHours}
    - Event/Trip Cost: ${data.currencySymbol}${data.eventCost}
    - User's Mood/Context: "${data.mood}"
    
    Calculated Feasibility Score: ${data.score}/100
    Recommendation: ${data.recommendation}
    
    **CRITICAL: Use a "Gen Z Hinglish" tone.** This means:
    - Mix Hindi and English naturally (e.g., "Bhai, kya kar raha hai?", "Paisa barbad", "Budget ka scene tight hai", "Kyu delulu ban raha hai?").
    - Use relatable slang (e.g., "no cap", "bet", "slay", "bestie", "main character energy", "delulu", "rent is due").
    - Use emojis frequently but naturally.
    - Be blunt but supportive, like a chaotic-good best friend from India.
    
    Provide a short, punchy summary (max 3 sentences) explaining why this recommendation was made.
    
    **CRITICAL**: If the recommendation is "Risky" or "Not Recommended", you MUST provide 1-2 specific alternative suggestions on how the user could still achieve their goal. Present these as a bulleted list in Hinglish (e.g., "* Ek hafta aur save karle", "* Event cost ${data.currencySymbol}50 kam kar", "* Sasta travel option dhund", or "* Pehle saare assignments khatam kar").
    
    Use the currency symbol "${data.currencySymbol}" throughout.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });
    return response.text || "Could not generate explanation.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "The AI is currently resting. Please try again later.";
  }
}

export async function getDNAInsight(data: {
  deadlines: number;
  events: number;
  freeHours: number;
  sleepHours: number;
  mood: string;
  custom: string;
  score: number;
  status: string;
}) {
  if (!GEMINI_API_KEY) {
    return "AI insight is unavailable because the API key is not configured.";
  }

  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  const model = "gemini-3-flash-preview";

  const prompt = `
    You are ExpEra, a wise and empathetic AI behavioral assistant.
    A user is checking their "Decision DNA" to detect burnout risk.
    
    User Data:
    - Deadlines this week: ${data.deadlines}
    - Events/Meetings: ${data.events}
    - Free Hours: ${data.freeHours}
    - Avg Sleep Hours: ${data.sleepHours}
    - Mood: "${data.mood}"
    - Custom Requirements: "${data.custom}"
    
    Calculated Stress Score: ${data.score}/100
    Status: ${data.status}
    
    Provide a concise (2-3 sentences) behavioral insight. 
    If the stress is high, give one actionable tip to reduce it (e.g., "Delegate one task" or "Prioritize sleep tonight").
    Keep the tone supportive and professional.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });
    return response.text || "Could not generate insight.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "The AI is currently resting. Please try again later.";
  }
}

export async function getRegretInsight(data: {
  itemName: string;
  itemCost: number;
  remainingBudget: number;
  recentSpending: number;
  mood: string;
  stressScore: number;
  regretIndex: number;
  status: string;
  alternative: string;
  currencySymbol: string;
}) {
  if (!GEMINI_API_KEY) {
    return "AI insight is unavailable because the API key is not configured.";
  }

  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  const model = "gemini-3-flash-preview";

  const prompt = `
    You are ExpEra, a wise and empathetic AI behavioral economist and psychologist.
    A user is using the "AI Regret Shield" to check if a purchase is impulsive or emotional.
    
    User Data:
    - Item Name: "${data.itemName}"
    - Item Cost: ${data.currencySymbol}${data.itemCost}
    - Remaining Budget: ${data.currencySymbol}${data.remainingBudget}
    - Recent Spending: ${data.currencySymbol}${data.recentSpending}
    - User Mood: "${data.mood}"
    - Stress Score (from DNA): ${data.stressScore}/100
    - Regret Index: ${data.regretIndex}/100
    - Status: ${data.status}
    - Alternative use for money: "${data.alternative}"
    
    Provide a short, punchy "Purchase Shield Summary" in Markdown format (max 3-4 sentences).
    
    **CRITICAL: Use a "Gen Z Hinglish" tone.** This means:
    - Mix Hindi and English naturally (e.g., "Bhai, kya kar raha hai?", "Paisa barbad", "Budget ka scene tight hai", "Kyu delulu ban raha hai?").
    - Use relatable slang (e.g., "no cap", "bet", "slay", "bestie", "main character energy", "delulu", "rent is due").
    - Use emojis frequently but naturally.
    - Be blunt but supportive, like a chaotic-good best friend from India.
    
    The summary should cover:
    - **The Verdict**: Is this purchase a "W" or an "L"?
    - **The Why**: Briefly analyze their "Mood" (${data.mood}) and "Alternative" (${data.alternative}).
    - **The Move**: Should they buy it or "touch grass" (wait)?
    
    Use the currency symbol "${data.currencySymbol}" throughout.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });
    return response.text || "Could not generate insight.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "The AI is currently resting. Please try again later.";
  }
}
