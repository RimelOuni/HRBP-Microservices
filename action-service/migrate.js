const { MongoClient } = require("mongodb");

// Base source : monolithe
const SOURCE_URI =
  "mongodb+srv://rimelouni24_db_user:cxjGPkcKdgWSLZjP@hrbpplatform.tv6csce.mongodb.net/test?appName=HRBPPlatform";

// Base destination : microservice action
const DEST_URI =
  "mongodb+srv://rimelouni24_db_user:cxjGPkcKdgWSLZjP@hrbpplatform.tv6csce.mongodb.net/action-db?appName=HRBPPlatform";


async function migrate() {

  const srcClient = new MongoClient(SOURCE_URI);
  const destClient = new MongoClient(DEST_URI);

  try {

    await srcClient.connect();
    await destClient.connect();

    console.log("✅ Connecté aux deux bases Atlas");


    // Récupérer les actions du monolithe
    const actions = await srcClient
      .db()
      .collection("actions")
      .find()
      .toArray();


    console.log(`📦 ${actions.length} actions trouvées dans la source`);


    if (actions.length > 0) {

      // Nettoyer la collection destination
      await destClient
        .db()
        .collection("actions")
        .deleteMany({});


      // Insérer dans action-db
      await destClient
        .db("action-db")
        .collection("actions")
        .insertMany(actions);


      console.log(`✅ ${actions.length} actions migrées vers action-db`);

    } else {

      console.log("⚠️ Aucune action à migrer");

    }


    // Vérification
    const count = await destClient
      .db("action-db")
      .collection("actions")
      .countDocuments();


    console.log(`✅ Vérification : ${count} documents dans action-db.actions`);


  } catch (err) {

    console.error("❌ Erreur migration :", err.message);

  } finally {

    await srcClient.close();
    await destClient.close();

    console.log("🔒 Connexions fermées");
  }

}


migrate();