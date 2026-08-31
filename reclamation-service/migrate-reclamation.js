require("dotenv").config();
const { MongoClient } = require("mongodb");

const DEST_URI = process.env.MONGO_URI;

if (!DEST_URI) {
  console.error("❌ MONGO_URI manquant dans le .env");
  process.exit(1);
}

const SOURCE_URI = DEST_URI.replace(/\/([^/?]+)(\?|$)/, "/test$2");

const COLLECTION = "reclamations";

async function migrate() {
  const srcClient  = new MongoClient(SOURCE_URI);
  const destClient = new MongoClient(DEST_URI);

  try {
    await srcClient.connect();
    await destClient.connect();
    console.log("✅ Connecté aux deux bases");

    const docs = await srcClient.db().collection(COLLECTION).find().toArray();
    console.log(`📦 ${docs.length} ${COLLECTION} trouvé(s) dans "test"`);

    if (docs.length > 0) {
      await destClient.db().collection(COLLECTION).deleteMany({});
      await destClient.db().collection(COLLECTION).insertMany(docs);
      console.log(`✅ ${docs.length} ${COLLECTION} migré(s)`);
    } else {
      console.log(`Aucun document à migrer pour ${COLLECTION}.`);
    }

    const count = await destClient.db().collection(COLLECTION).countDocuments();
    console.log(`✅ Vérification : ${count} documents`);
  } catch (err) {
    console.error("❌ Erreur :", err.message);
  } finally {
    await srcClient.close();
    await destClient.close();
  }
}

migrate();