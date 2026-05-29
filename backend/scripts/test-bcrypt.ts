import bcrypt from 'bcryptjs';

async function main() {
  console.log('Testing bcrypt performance...');
  const password = 'Admin@2024!';
  const hash = await bcrypt.hash(password, 12);
  console.log('Hashed password successfully:', hash);
  const start = Date.now();
  const match = await bcrypt.compare(password, hash);
  const end = Date.now();
  console.log('Bcrypt compare finished in', end - start, 'ms. Match:', match);
}

main();
