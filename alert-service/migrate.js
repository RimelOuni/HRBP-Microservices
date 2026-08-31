const { MongoClient } = require("mongodb");

// Base source : monolithe HRBP Platform
const SOURCE_URI =
  "mongodb+srv://rimelouni24_db_user:cxjGPkcKdgWSLZjP@hrbpplatform.tv6csce.mongodb.net/test?appName=HRBPPlatform";

// Base destination : microservice alert
const DEST_URI =
  "mongodb+srv://rimelouni24_db_user:cxjGPkcKdgWSLZjP@hrbpplatform.tv6csce.mongodb.net/alert-db?appName=HRBPPlatform";


async function migrate() {

  const srcClient = new MongoClient(SOURCE_URI);
  const destClient = new MongoClient(DEST_URI);

  try {

    await srcClient.connect();
    await destClient.connect();

    console.log("✅ Connecté aux deux bases Atlas");


    // Récupération des alerts depuis le monolithe
    const alerts = await srcClient
      .db()
      .collection("alerts")
      .find()
      .toArray();


    console.log(`📦 ${alerts.length} alerts trouvées dans la source`);


    if (alerts.length > 0) {

      // Nettoyage de la collection destination
      await destClient
        .db("alert-db")
        .collection("alerts")
        .deleteMany({});


      // Insertion dans alert-db
      await destClient
        .db("alert-db")
        .collection("alerts")
        .insertMany(alerts);


      console.log(`✅ ${alerts.length} alerts migrées vers alert-db`);

    } else {

      console.log("⚠️ Aucune alert à migrer");

    }


    // Vérification finale
    const count = await destClient
      .db("alert-db")
      .collection("alerts")
      .countDocuments();


    console.log(`✅ Vérification : ${count} documents dans alert-db.alerts`);


  } catch (err) {

    console.error("❌ Erreur migration :", err.message);

  } finally {

    await srcClient.close();
    await destClient.close();

    console.log("🔒 Connexions fermées");

  }

}


migrate();