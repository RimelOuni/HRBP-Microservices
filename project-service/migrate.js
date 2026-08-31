const { MongoClient } = require("mongodb");

const SOURCE_URI = "mongodb+srv://rimelouni24_db_user:cxjGPkcKdgWSLZjP@hrbpplatform.tv6csce.mongodb.net/test?appName=HRBPPlatform";
const DEST_URI   = "mongodb+srv://rimelouni24_db_user:cxjGPkcKdgWSLZjP@hrbpplatform.tv6csce.mongodb.net/project-db?appName=HRBPPlatform";

async function migrate() {

  const srcClient = new MongoClient(SOURCE_URI);
  const destClient = new MongoClient(DEST_URI);

  try {

    await srcClient.connect();
    await destClient.connect();

    console.log("✅ Connecté aux deux bases");

    const projects =
      await srcClient
        .db()
        .collection("projects")
        .find()
        .toArray();


    console.log(`📦 ${projects.length} projets trouvés`);


    if(projects.length > 0){

      await destClient
        .db()
        .collection("projects")
        .deleteMany({});


      await destClient
        .db()
        .collection("projects")
        .insertMany(projects);


      console.log("✅ Projets migrés");
    }


    const count =
      await destClient
        .db()
        .collection("projects")
        .countDocuments();


    console.log(`✅ Vérification : ${count} documents`);

  }

  catch(err){
    console.error(err.message);
  }

  finally{
    await srcClient.close();
    await destClient.close();
  }

}


migrate();