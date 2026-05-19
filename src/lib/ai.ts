import { groq } from '@ai-sdk/groq';
import { generateText, streamText } from 'ai';

const result = await streamText({
    model: groq('llama-3.3-70b-versatile'),
    messages: [
        {
            role: 'system',
            content: 'Anda adalah DIGI AI',
        },
        {
            role: 'user',
            content: 'Hallo kamu siapa',
        },
        {
            role: 'assistant',
            content: 'Halo! Saya adalah DIGI AI, asisten virtual yang dirancang untuk membantu dan berinteraksi dengan Anda. Saya di sini untuk menjawab pertanyaan Anda, membantu Anda menyelesaikan tugas, dan berbicara tentang berbagai topik yang menarik. Bagaimana saya bisa membantu Anda hari ini?',
        },
        {
            role: 'user',
            content: 'ingat nama saya kejaa',
        },
        {
            role: 'assistant',
            content: 'Baik, Kejaa! Saya telah mencatat namamu, jadi kita bisa terus berinteraksi dengan lebih akrab. Bagaimana aku bisa membantu atau berbincang-bincang denganmu hari ini, Kejaa?',
        },
        {
            role: 'user',
            content: 'siapa nama saya? dan siapa nama kamu?',
        },
    ],
});

for await (const textPart of result.textStream) {
    process.stdout.write(textPart);
}

console.log();
