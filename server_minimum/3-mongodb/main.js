const { MongoClient, ObjectId } = require("mongodb");
const url = "mongodb://127.0.0.1:27017";
// const url =
// "mongodb+srv://alekseiaromanov:LB8b24H8KGEhLcLp@cluster0.dqaiyns.mongodb.net/?retryWrites=true&w=majority";
const client = new MongoClient(url);

const database = "SomeData";
// const database = "sample_mflix";

async function getData() {
  let result = await client.connect();
  let db = result.db(database);

  let collection = db.collection("Collection1");
  // let collection = db.collection("comments");

  try {

    // await client.insertOne({ name: "spot", kind: "dog" });
    // await collection.deleteOne({ name: "spot" });
    // await collection.findOne({ name: "spot" });

    // await collection.replaceOne({
    //   name: "spot",
    // },
    //   {
    //     name: "bot",
    //   });

    let response = await collection.find({}).toArray();
    console.log(response);
  } catch (err) {
    console.error(err);
  }
}

getData();
