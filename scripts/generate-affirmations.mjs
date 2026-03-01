import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

const affirmations = [
    "You are doing enough, even when it doesn't feel like it.",
    "Your feelings are valid, and you deserve to take up space.",
    "Every day is a fresh start. You don't have to carry yesterday with you.",
    "You are allowed to rest before your body forces you to.",
    "Your progress is still progress, even if it's quiet.",
    "You have survived 100% of your bad days. You've got this.",
    "It is okay to not have it all figured out right now.",
    "You bring something completely unique to this world.",
    "Your boundaries are important and deserve to be respected.",
    "You are worthy of the same kindness you give to others.",
    "Growth isn't linear. Be patient with yourself.",
    "You are capable of handling whatever comes your way today.",
    "Your worth is not measured by your productivity.",
    "You don't have to earn the right to feel at peace.",
    "It is okay to let go of things that are no longer serving you.",
    "You are allowed to change your mind and your path.",
    "Your energy is valuable. Protect it.",
    "You are exactly where you need to be to learn what you need to learn.",
    "Small steps are still moving you forward.",
    "You deserve to be celebrated, simply for existing.",
    "It's okay to ask for help. You don't have to do it all alone.",
    "You are more resilient than you realize.",
    "Your voice matters, and your story is important.",
    "You are allowed to say no without an explanation.",
    "Healing takes time. Give yourself grace.",
    "You possess a quiet strength that carries you through.",
    "You deserve good things, and it is safe to receive them.",
    "Your authentic self is your best self.",
    "You are not defined by your past or your mistakes.",
    "You have the power to create a life that feels good to you.",
    "Take a deep breath. You are safe, and you are entirely up to you."
];

const csvPath = path.join(rootDir, 'data', 'affirmations_database.csv');

// Create the CSV content: Day of Month, Quote
let csvContent = 'Day_of_Month,Affirmation\n';
affirmations.forEach((quote, index) => {
    // 1 to 31
    const day = index + 1;
    // Wrapping quotes in standard double-quotes to handle any commas safely
    csvContent += `${day},"${quote}"\n`;
});

fs.writeFileSync(csvPath, csvContent, 'utf-8');
console.log(`✅ Successfully generated affirmations_database.csv at ${csvPath}`);
console.log(`It contains 31 days of affirmations designed to loop every month!`);
