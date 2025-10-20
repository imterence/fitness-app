# 🤖 AI Trainer Setup Guide

## Overview

Your app now includes an **AI Trainer chatbot** powered by OpenAI's GPT models. Users can chat with "Coach AI" 24/7 for fitness advice, workout tips, Hyrox training guidance, and motivation!

## ✨ Features

### What Coach AI Can Do:
- ✅ Answer fitness and nutrition questions
- ✅ Provide personalized workout recommendations
- ✅ Give Hyrox training advice
- ✅ Motivate and encourage users
- ✅ Explain exercise form and techniques
- ✅ Create custom training plans
- ✅ Available 24/7 with instant responses

### User Experience:
- 🎨 Beautiful gradient UI (blue/purple theme)
- 💬 Natural conversation flow with message history
- 🔄 Seamless toggle between human trainer and AI trainer
- 📱 Responsive design for all devices
- ⚡ Fast responses (typically 2-3 seconds)

## 🚀 Setup Instructions

### Option 1: Use OpenAI (Recommended)

1. **Get an OpenAI API Key:**
   - Go to https://platform.openai.com/api-keys
   - Sign up or log in
   - Click "Create new secret key"
   - Copy your API key (starts with `sk-`)

2. **Add to Environment Variables:**
   ```bash
   # In your .env file:
   OPENAI_API_KEY=sk-your-actual-api-key-here
   ```

3. **Restart your server:**
   ```bash
   npm run dev
   ```

4. **Test it:**
   - Go to `/chat` page
   - Click "Coach AI" button in the header
   - Send a message like "How do I prepare for Hyrox?"

### Option 2: Use Demo Mode (No API Key)

If you don't add an API key, the AI Trainer will work in **demo mode** with pre-written responses. This is great for:
- Testing the UI
- Development without API costs
- Demos and presentations

**Note:** Demo mode shows a disclaimer: "_Note: AI trainer is in demo mode._"

## 💰 Cost Information

### OpenAI Pricing (as of 2024):
- **GPT-4o-mini**: ~$0.15 per 1M input tokens, ~$0.60 per 1M output tokens
- **Typical conversation**: ~500-1000 tokens per message
- **Estimated cost**: $0.0005 - $0.001 per message (very affordable!)

### Cost Optimization:
The AI Trainer is configured with:
- ✅ Message history limited to last 10 messages (saves tokens)
- ✅ Max response length: 500 tokens (concise answers)
- ✅ Using `gpt-4o-mini` model (most cost-effective)

**Estimated monthly cost for 100 users with 50 messages each:** ~$2.50

## 🎯 AI Trainer Personality

Coach AI is configured to be:
- **Knowledgeable**: Expert in fitness and Hyrox training
- **Encouraging**: Motivational and supportive
- **Practical**: Provides actionable advice
- **Safety-focused**: Prioritizes proper form and injury prevention
- **Accessible**: Explains complex terms in simple language

### Example Conversations:

**User:** "How do I prepare for Hyrox?"
**Coach AI:** "Great question! Hyrox requires a unique blend of strength and endurance. I recommend a 12-week prep plan focusing on:

1. **Cardio Base** (3x/week): Mix steady-state runs with interval training
2. **Functional Strength** (2-3x/week): Sled pushes, farmers carries, wall balls
3. **Skill Practice** (2x/week): Row, ski erg, and sandbag work

Start with lower volume and gradually increase. Remember, consistency beats intensity! What's your current fitness level? 💪"

## 🛠️ Customization

### Change AI Model:
Edit `src/app/api/chat/ai-trainer/route.ts`:
```typescript
model: "gpt-4o-mini" // Change to "gpt-4" for better responses (higher cost)
```

### Adjust Response Length:
```typescript
max_tokens: 500 // Increase for longer responses (higher cost)
```

### Modify Personality:
Edit the `AI_TRAINER_SYSTEM_PROMPT` in the same file to change how Coach AI behaves.

### Add More Demo Responses:
Edit the `mockResponses` array in `mockAIResponse()` function.

## 📊 Features Breakdown

### API Endpoints

#### `POST /api/chat/ai-trainer`
- Sends message to AI and gets response
- Saves conversation to database
- Returns both user message and AI response

#### `GET /api/chat/ai-trainer`
- Retrieves conversation history
- Returns last 100 messages
- Formatted with proper sender info

### Database Structure

Messages are stored in the existing `Message` table with:
- `conversationId`: "ai-trainer" (virtual conversation)
- `senderId`: User ID or "ai-trainer-bot"
- `content`: Message text
- `isRead`: Boolean flag

No schema changes needed! ✅

## 🎨 UI Components

### AITrainerChat Component
- Full-featured chat interface
- Message bubbles with avatars
- Loading states and animations
- Suggested questions for new users
- Gradient background theme

### Chat Toggle
- Seamless switch between human and AI trainer
- Maintains separate conversation history
- Visual indicators (icons, colors)

## 🔒 Security & Privacy

- ✅ User authentication required
- ✅ Messages tied to user accounts
- ✅ No data shared between users
- ✅ OpenAI API calls are server-side only
- ✅ Conversation history stored securely in your database

## 🐛 Troubleshooting

### AI not responding:
1. Check API key is set correctly in `.env`
2. Verify server restarted after adding key
3. Check browser console for errors
4. Test API key at https://platform.openai.com/playground

### Demo mode not working:
- Demo mode is the fallback - should always work
- Check server logs for errors

### Slow responses:
- Normal: 2-4 seconds for gpt-4o-mini
- Check your OpenAI account for rate limits
- Consider switching to gpt-3.5-turbo for faster responses

## 🚢 Deployment

### Vercel/Production:
1. Add `OPENAI_API_KEY` to environment variables in Vercel dashboard
2. Deploy as normal
3. Test in production environment

### Environment Variable:
```bash
# In Vercel dashboard:
OPENAI_API_KEY=sk-your-production-key-here
```

## 📈 Future Enhancements

Potential additions:
- 🎯 Workout plan generator with calendar integration
- 📊 Progress tracking and analysis
- 🏋️ Exercise form videos and GIFs
- 🍎 Nutrition meal planning
- 📱 Voice input/output
- 🌐 Multi-language support
- 📈 Analytics dashboard for AI usage

## 💡 Tips

1. **Monitor Costs**: Check OpenAI usage dashboard regularly
2. **Rate Limiting**: Consider adding rate limits if needed
3. **User Feedback**: Add thumbs up/down for AI responses
4. **Fine-tuning**: Collect good conversations to fine-tune a custom model
5. **Fallback**: Keep demo mode as backup if API fails

## 🎉 You're Done!

Your AI Trainer is ready to help your users 24/7! Just add your OpenAI API key and users can start chatting with Coach AI immediately.

Questions? Issues? Check the code comments in:
- `src/app/api/chat/ai-trainer/route.ts`
- `src/components/AITrainerChat.tsx`
- `src/app/chat/page.tsx`

