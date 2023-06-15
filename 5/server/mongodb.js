/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
const { MongoClient, ObjectId } = require("mongodb");
const url = "mongodb://127.0.0.1:27017";

const client = new MongoClient(url);

const database = "SumPractice-5";

async function baseGetData(nameCollection, sito) {
  let result = await client.connect();
  let db = result.db(database);

  let collection = db.collection(nameCollection);

  try {
    let response = await collection.find(sito).toArray();
    return response;
  } catch (err) {
    console.error(err);
    return null;
  }
}

async function baseAddData(nameCollection, data) {
  let result = await client.connect();
  let db = result.db(database);

  let collection = db.collection(nameCollection);

  try {
    let response = await collection.insertOne(data).toArray();
    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
}

module.exports = { getData: baseGetData, addData: baseAddData };
