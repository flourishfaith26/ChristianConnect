import { crisisKeywords } from './crisisKeywords';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY ?? '';
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

export interface FaithChatResult {
  response: string;
  isCrisis: boolean;
  requiresRedirect: boolean;
}

/**
 * Checks query content against a comprehensive list of crisis keywords.
 */
export function detectCrisis(text: string): boolean {
  const normalized = text.toLowerCase();
  return crisisKeywords.some((keyword) => normalized.includes(keyword));
}

/**
 * Helper to query Claude with our specific system prompts.
 */
export async function askFaithChat(query: string): Promise<FaithChatResult> {
  // 1. Check for crisis disclosure first
  if (detectCrisis(query)) {
    return {
      response: 'It looks like you might be going through a very difficult time. We want to support you, but we are an AI assistant. Please contact a professional or call/text 988 immediately for free, confidential 24/7 support.',
      isCrisis: true,
      requiresRedirect: true,
    };
  }

  if (!ANTHROPIC_API_KEY) {
    const queryLower = query.toLowerCase();
    let responseText = '';

    if (queryLower.includes('hello') || queryLower.includes('hi') || queryLower.includes('hey') || queryLower.includes('greetings')) {
      responseText = 'Grace and peace be to you! I am your Faith AI Companion. How can I assist your spiritual journey, Bible study, or prayer needs today? (1 Corinthians 1:3)';
    } else if (queryLower.includes('comfort') || queryLower.includes('peace') || queryLower.includes('sad') || queryLower.includes('anxious') || queryLower.includes('worry')) {
      responseText = 'May the peace of God, which surpasses all understanding, guard your heart and mind in Christ Jesus. (Philippians 4:6-7). "The LORD is close to the brokenhearted and saves those who are crushed in spirit." (Psalm 34:18). Take heart, for He is faithful.';
    } else if (queryLower.includes('love') || queryLower.includes('hope') || queryLower.includes('faith')) {
      responseText = '"And now these three remain: faith, hope and love. But the greatest of these is love." (1 Corinthians 13:13). "For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life." (John 3:16)';
    } else {
      responseText = `Grace and peace to you regarding "${query}". "Trust in the LORD with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight." (Proverbs 3:5-6). May His Word illuminate your steps today!`;
    }

    return {
      response: responseText,
      isCrisis: false,
      requiresRedirect: false,
    };
  }

  const systemPrompt = `You are a theological assistant for "ChristianConnect," a faith-based community web app.
Your goals are to help users explore theology, scripture, and practical daily faith questions.
You must adhere to these strict rules:
1. Denominational Fairness: Always present major Christian denominational perspectives (such as Protestant/Baptist, Catholic, Reformed, Orthodox, and Pentecostal/Charismatic) fairly and objectively. Do not declare one specific denomination or tradition as the single definitive truth; instead, present where they agree and clarify their historical or doctrinal differences with humility.
2. Inter-faith Respectfulness: When asked about other world religions (e.g., Islam, Judaism, Buddhism, Hinduism), describe their beliefs and history accurately and respectfully. Do not engage in argumentative, mocking, or polemical language. Keep the tone loving, scholarly, and Christ-like.
3. Citation of Scripture: Cite actual Bible chapter and verse references (e.g., Romans 12:1-2, Ephesians 2:8-9) for every theological assertion or claim you make so users can verify them independently.
4. Crisis Safety: Although you screen for crisis indicators, if at any point the user discloses self-harm, suicidal ideation, or severe abuse, immediately stop theological Q&A and provide emergency safety hotlines (e.g. 988, local emergency services) with absolute priority.`;

  try {
    const res = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: 'user', content: query }],
      }),
    });

    if (!res.ok) {
      throw new Error(`Claude API error: ${res.status}`);
    }

    const data = await res.json() as {
      content: { text: string }[];
    };

    return {
      response: data.content[0]?.text ?? 'No response received.',
      isCrisis: false,
      requiresRedirect: false,
    };
  } catch (err) {
    console.error('[FaithChatService] Claude query error:', err);
    throw new Error('Failed to retrieve theological response from Faith Chat.');
  }
}
