// Generate bcrypt password hashes for seed data
const bcrypt = require('bcryptjs');

const password = 'password123';
const saltRounds = 10;

async function generateHashes() {
    console.log('Generating bcrypt hashes for password: password123\n');
    
    // Generate 4 hashes (one for each user)
    for (let i = 1; i <= 4; i++) {
        const hash = await bcrypt.hash(password, saltRounds);
        console.log(`Hash ${i}: ${hash}`);
    }
}

generateHashes();
