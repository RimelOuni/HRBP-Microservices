/**
 * migrate.js — Copie la collection "practices" du monolithe vers practice-db
 * Exécuter UNE SEULE FOIS : node migrate.js
 */

const { MongoClient } = require("mongodb");

const SOURCE_URI = "mongodb+srv://rimelouni24_db_user:cxjGPkcKdgWSLZjP@hrbpplatform.tv6csce.mongodb.net/test?appName=HRBPPlatform";
const DEST_URI   = "mongodb+srv://rimelouni24_db_user:cxjGPkcKdgWSLZjP@hrbpplatform.tv6csce.mongodb.net/practice-db?appName=HRBPPlatform";

async function migrate() {
  const srcClient  = new MongoClient(SOURCE_URI);
  const destClient = new MongoClient(DEST_URI);

  try {
    await srcClient.connect();
    await destClient.connect();
    console.log("✅ Connecté aux deux bases Atlas");

    const practices = await srcClient.db().collection("practices").find().toArray();
    console.log(`📦 ${practices.length} practices trouvées dans hrbp_db`);

    if (practices.length > 0) {
      await destClient.db().collection("practices").deleteMany({});
      await destClient.db().collection("practices").insertMany(practices);
      console.log(`✅ ${practices.length} practices migrées vers practice-db`);
    } else {
      console.log("Aucune practice à migrer.");
    }

    const count = await destClient.db().collection("practices").countDocuments();
    console.log(`✅ Vérification : ${count} documents dans practice-db`);

  } catch (err) {
    console.error("❌ Erreur :", err.message);
    process.exit(1);
  } finally {
    await srcClient.close();
    await destClient.close();
    console.log("Connexions fermées.");
  }
}

migrate();
