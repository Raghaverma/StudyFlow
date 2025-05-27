
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Task, HabitLog } from '../types';
import { MOCK_API_KEY } from '../constants';


// IMPORTANT: Replace MOCK_API_KEY with actual process.env.API_KEY in a real environment
// const apiKey = process.env.API_KEY; 
// For this example, we use a mock key, but the structure for process.env.API_KEY is shown.
// Ensure API_KEY is set in your environment for this to work.
let apiKey = MOCK_API_KEY; 
if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
  apiKey = process.env.API_KEY;
} else {
  console.warn("API_KEY environment variable not found. Using mock key. Gemini API calls will fail.");
}

const ai = new GoogleGenAI({ apiKey: apiKey });

// Placeholder for a more complex prompt generation logic
const generateSimpleTaskPrompt = (tasks: Task[]): string => {
  if (tasks.length === 0) return "No tasks to schedule.";
  const taskSummary = tasks.map(t => `- ${t.title} (Due: ${t.dueDate || 'N/A'}, Estimated: ${t.estimatedTime || 'N/A'}h)`).join('\\n');
  return `
    I have the following tasks:
    ${taskSummary}
    Suggest a simple distribution for these tasks over the next few days.
    For example: "You have 3 tasks due Friday totaling 5 hours. Spread them over Mon-Thurs."
    Keep the suggestion concise and actionable.
  `;
};

export const getSchedulingSuggestions = async (tasks: Task[]): Promise<string> => {
  if (!apiKey || apiKey === MOCK_API_KEY) {
    console.warn("Gemini API call skipped: API key not configured.");
    // Simulate a delay and return a mock suggestion
    await new Promise(resolve => setTimeout(resolve, 500));
    if (tasks.length === 0) return "No tasks to schedule. Add some tasks first!";
    const totalEstimatedTime = tasks.reduce((sum, task) => sum + (task.estimatedTime || 0), 0);
    return `Mock Suggestion: You have ${tasks.length} task(s) totaling ~${totalEstimatedTime} hours. Consider dedicating focused blocks of time for them. For example, allocate 2 hours tomorrow morning for '${tasks[0]?.title || 'your first task'}'.`;
  }

  if (tasks.length === 0) {
    return "No tasks to schedule. Add some tasks first!";
  }

  const prompt = generateSimpleTaskPrompt(tasks);

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash-preview-04-17', // Use appropriate model
      contents: prompt,
      config: { // Default thinking config (enabled)
        temperature: 0.7,
      }
    });
    return response.text.trim();
  } catch (error) {
    console.error("Error fetching scheduling suggestions from Gemini:", error);
    return "Could not fetch scheduling suggestions at this time. Please try again later.";
  }
};


export const getHabitFocusCorrelation = async (habitLogs: HabitLog[]): Promise<string> => {
   if (!apiKey || apiKey === MOCK_API_KEY) {
    console.warn("Gemini API call skipped: API key not configured.");
    await new Promise(resolve => setTimeout(resolve, 500));
    return "Mock Insight: Users who consistently log 'Reviewed Notes' tend to report higher focus levels during study sessions.";
  }
  
  if (habitLogs.length < 5) { // Need some data for correlation
    return "Not enough habit data to provide insights. Keep tracking your habits!";
  }

  // This is a simplified prompt. A real scenario would need more structured data.
  const prompt = `
    Analyze the following habit logs and provide a simple correlation insight related to study focus.
    Assume some habits might be 'Reviewed Notes', 'Slept 8 hours', 'Meditated', and some logs might include a focus level (1-5) for 'Study Session'.
    Example insight: "When you 'Review Notes' before studying, your average focus is X."
    Logs: ${JSON.stringify(habitLogs.slice(0,10))}... (sample)
    Provide a concise insight.
  `;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash-preview-04-17',
      contents: prompt,
       config: { temperature: 0.5 }
    });
    return response.text.trim();
  } catch (error) {
    console.error("Error fetching habit correlation from Gemini:", error);
    return "Could not fetch habit insights at this time.";
  }
};

// Example of using image generation - not directly used in current UI but shows capability
export const generateInspirationalImage = async (promptText: string): Promise<string | null> => {
  if (!apiKey || apiKey === MOCK_API_KEY) {
    console.warn("Gemini Image API call skipped: API key not configured.");
    return `https://picsum.photos/seed/${encodeURIComponent(promptText)}/400/300`; // Placeholder image
  }
  try {
    const response = await ai.models.generateImages({
        model: 'imagen-3.0-generate-002',
        prompt: `Inspirational image for a student: ${promptText}`,
        config: {numberOfImages: 1, outputMimeType: 'image/jpeg'},
    });

    if (response.generatedImages && response.generatedImages.length > 0) {
      const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
      return `data:image/jpeg;base64,${base64ImageBytes}`;
    }
    return null;
  } catch (error) {
    console.error("Error generating image with Gemini:", error);
    return `https://picsum.photos/seed/error/400/300`; // Fallback placeholder
  }
};
