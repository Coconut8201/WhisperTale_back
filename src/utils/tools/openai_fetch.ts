import OpenAI from 'openai';
import dotenv from 'dotenv';
dotenv.config();

const openai = new OpenAI({
    apiKey: process.env.openai_api_key
});

export async function openAIFetch(message: string) {
    // Non-streaming:
    const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: message }],
    });
    return completion.choices[0]?.message?.content ?? "";
    // // Streaming:
    // const stream = await openai.chat.completions.create({
    //     model: 'gpt-4',
    //     messages: [{ role: 'user', content: message }],
    //     stream: true,
    // });
    // for await (const part of stream) {
    //     process.stdout.write(part.choices[0]?.delta?.content || '');
    // }
}