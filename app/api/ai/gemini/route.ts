import { NextRequest, NextResponse } from 'next/server'

const GEMINI_API_KEY = 'AIzaSyAZsKM_t3N-KQ2BO2vfEbtu_FAf_zFVRnU'
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent'

interface CodeChange {
  original: string
  modified: string
  lineStart?: number
  lineEnd?: number
}

export async function POST(request: NextRequest) {
  try {
    const { message, context, fileContent, fileName } = await request.json()

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // Build prompt based on context
    let prompt = ''
    
    if (fileContent && fileName) {
      // Code review/edit mode
      prompt = `You are a professional code assistant. The user is editing a file: ${fileName}

Current file content:
\`\`\`
${fileContent}
\`\`\`

${context ? `Context: ${context}\n\n` : ''}

User request: ${message}

IMPORTANT RULES:
1. Automatically make the requested changes
2. If modifying code, respond ONLY with a JSON array of changes in this EXACT format:
{
  "changes": [
    {
      "original": "exact code to be replaced",
      "modified": "new code to replace it with",
      "explanation": "brief reason for change"
    }
  ]
}
3. If the user is asking a question (not requesting changes), respond normally with explanation
4. For code modifications: find the exact original code section and provide the replacement
5. Multiple changes should be separate objects in the array

Respond with JSON for code changes, or plain text for questions.`
    } else {
      // File browsing mode
      prompt = `You are a file system assistant. 

${context}

User question: ${message}

IMPORTANT RULES:
1. Be concise - answer ONLY what was asked
2. Use **bold** for file/folder names
3. Use bullet points for lists
4. NO extra information unless requested
5. If listing files, format clearly with sizes
6. Answer questions about files directly

Respond professionally and to the point.`
    }

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        },
        safetySettings: [
          {
            category: 'HARM_CATEGORY_HARASSMENT',
            threshold: 'BLOCK_NONE'
          },
          {
            category: 'HARM_CATEGORY_HATE_SPEECH',
            threshold: 'BLOCK_NONE'
          },
          {
            category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
            threshold: 'BLOCK_NONE'
          },
          {
            category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
            threshold: 'BLOCK_NONE'
          }
        ]
      })
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('Gemini API error:', errorData)
      return NextResponse.json({ 
        error: 'AI service temporarily unavailable',
        details: errorData 
      }, { status: 500 })
    }

    const data = await response.json()
    
    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
      return NextResponse.json({ 
        error: 'Invalid response from AI service' 
      }, { status: 500 })
    }

    let aiResponse = data.candidates[0].content.parts[0].text

    // Parse code changes if in edit mode
    let codeChanges: CodeChange[] = []
    let isCodeChange = false
    
    if (fileContent && fileName) {
      // Try to parse as JSON first (for code changes)
      try {
        // Look for JSON in the response
        const jsonMatch = aiResponse.match(/\{[\s\S]*"changes"[\s\S]*\}/)
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0])
          if (parsed.changes && Array.isArray(parsed.changes)) {
            codeChanges = parsed.changes.map((change: any) => ({
              original: change.original || '',
              modified: change.modified || '',
              explanation: change.explanation
            }))
            isCodeChange = true
            // Replace response with just explanations
            aiResponse = parsed.changes
              .map((c: any, i: number) => `**Change ${i + 1}:** ${c.explanation}`)
              .join('\n\n')
          }
        }
      } catch (e) {
        // Not JSON, treat as normal response
      }
      
      // Fallback: detect code blocks if JSON parsing failed
      if (!isCodeChange) {
        const codeBlockRegex = /```[\w]*\n([\s\S]*?)```/g
        const matches = [...aiResponse.matchAll(codeBlockRegex)]
        
        const changeKeywords = ['change', 'fix', 'modify', 'update', 'replace', 'add', 'remove']
        const hasChangeIntent = changeKeywords.some(kw => message.toLowerCase().includes(kw))
        
        if (matches.length > 0 && hasChangeIntent) {
          matches.forEach(match => {
            const suggestedCode = match[1].trim()
            codeChanges.push({
              original: '',
              modified: suggestedCode
            })
          })
        }
      }
    }

    return NextResponse.json({
      response: aiResponse,
      codeChanges: codeChanges.length > 0 ? codeChanges : undefined,
      isCodeChange
    })

  } catch (error: any) {
    console.error('AI request failed:', error)
    return NextResponse.json({ 
      error: 'Failed to process AI request',
      details: error.message 
    }, { status: 500 })
  }
}
