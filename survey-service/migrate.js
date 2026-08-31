const { MongoClient } = require("mongodb");

// Base source : monolithe HRBP Platform
const SOURCE_URI =
  "mongodb+srv://rimelouni24_db_user:cxjGPkcKdgWSLZjP@hrbpplatform.tv6csce.mongodb.net/test?appName=HRBPPlatform";

// Base destination : survey-service
const DEST_URI =
  "mongodb+srv://rimelouni24_db_user:cxjGPkcKdgWSLZjP@hrbpplatform.tv6csce.mongodb.net/survey-db?appName=HRBPPlatform";


async function migrate() {

  const srcClient = new MongoClient(SOURCE_URI);
  const destClient = new MongoClient(DEST_URI);

  try {

    await srcClient.connect();
    await destClient.connect();

    console.log("✅ Connecté aux deux bases Atlas");


    // Récupération des surveys depuis le monolithe
    const surveys = await srcClient
      .db()
      .collection("surveys")
      .find()
      .toArray();


    console.log(`📦 ${surveys.length} surveys trouvés dans la source`);


    if (surveys.length > 0) {

      // Nettoyer la collection destination
      await destClient
        .db("survey-db")
        .collection("surveys")
        .deleteMany({});


      // Insérer les surveys dans survey-db
      await destClient
        .db("survey-db")
        .collection("surveys")
        .insertMany(surveys);


      console.log(`✅ ${surveys.length} surveys migrés vers survey-db`);

    } else {

      console.log("⚠️ Aucun survey à migrer");

    }


    // Vérification
    const count = await destClient
      .db("survey-db")
      .collection("surveys")
      .countDocuments();


    console.log(`✅ Vérification : ${count} documents dans survey-db.surveys`);


  } catch (err) {

    console.error("❌ Erreur migration :", err.message);

  } finally {

    await srcClient.close();
    await destClient.close();

    console.log("🔒 Connexions fermées");

  }

}


migrate();