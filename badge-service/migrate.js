const { MongoClient } = require("mongodb");

// Base source : monolithe HRBP Platform
const SOURCE_URI =
  "mongodb+srv://rimelouni24_db_user:cxjGPkcKdgWSLZjP@hrbpplatform.tv6csce.mongodb.net/test?appName=HRBPPlatform";

// Base destination : badge-service
const DEST_URI =
  "mongodb+srv://rimelouni24_db_user:cxjGPkcKdgWSLZjP@hrbpplatform.tv6csce.mongodb.net/badge-db?appName=HRBPPlatform";


async function migrate() {

  const srcClient = new MongoClient(SOURCE_URI);
  const destClient = new MongoClient(DEST_URI);

  try {

    await srcClient.connect();
    await destClient.connect();

    console.log("✅ Connecté aux deux bases Atlas");


    // Récupération des badges depuis le monolithe
    const badges = await srcClient
      .db()
      .collection("badges")
      .find()
      .toArray();


    console.log(`📦 ${badges.length} badges trouvés dans la source`);


    if (badges.length > 0) {

      // Nettoyage de la collection destination
      await destClient
        .db("badge-db")
        .collection("badges")
        .deleteMany({});


      // Insertion dans badge-db
      await destClient
        .db("badge-db")
        .collection("badges")
        .insertMany(badges);


      console.log(`✅ ${badges.length} badges migrés vers badge-db`);

    } else {

      console.log("⚠️ Aucun badge à migrer");

    }


    // Vérification
    const count = await destClient
      .db("badge-db")
      .collection("badges")
      .countDocuments();


    console.log(`✅ Vérification : ${count} documents dans badge-db.badges`);


  } catch (err) {

    console.error("❌ Erreur migration :", err.message);

  } finally {

    await srcClient.close();
    await destClient.close();

    console.log("🔒 Connexions fermées");

  }

}


migrate();