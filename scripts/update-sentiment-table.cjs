const main = async () => {
  const mysql = require('mysql2/promise');
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.log("No DATABASE_URL");
    process.exit(1);
  }
  const connection = await mysql.createConnection(url);
  try {
    await connection.execute(`ALTER TABLE sentiment_snapshots ADD COLUMN IF NOT EXISTS per_speaker_sentiment TEXT`);
    console.log("OK sentiment_snapshots update");
  } catch (e) {
    console.log("ERR sentiment_snapshots update: " + (e.message || ""));
  }
  await connection.end();
  process.exit(0);
};

main();
