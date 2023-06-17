/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
const { MongoClient, ObjectId } = require("mongodb");
const url = "mongodb://127.0.0.1:27017";

const client = new MongoClient(url);

const database = "SumPractice-5";

async function getDB(nameCollection) {
  let result = await client.connect();
  let db = result.db(database);

  return db.collection(nameCollection);
}

async function baseGetOneData(nameCollection, sito) {
  let result = await client.connect();
  let db = result.db(database);

  let collection = db.collection(nameCollection);

  try {
    let response = await collection.findOne(sito);
    return response;
  } catch (err) {
    console.error(err);
    return null;
  }
}
async function baseUpdateData(nameCollection, sito) {
  let result = await client.connect();
  let db = result.db(database);

  let collection = db.collection(nameCollection);

  try {
    let response = await collection.findOneAndUpdate(sito);
    return response;
  } catch (err) {
    console.error(err);
    return null;
  }
}
async function baseUpdateData(nameCollection, sito) {
  let result = await client.connect();
  let db = result.db(database);

  let collection = db.collection(nameCollection);

  try {
    let response = await collection.findOneAndReplace(sito);
    return response;
  } catch (err) {
    console.error(err);
    return null;
  }
}
async function baseGetMoreData(nameCollection, sito) {
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
    let response = await collection.insertOne(data);
    return response;
  } catch (err) {
    console.error(err);
    return false;
  }
}

module.exports = {
  getOneData: baseGetOneData,
  getMoreData: baseGetMoreData,
  addData: baseAddData,
  updateData: baseUpdateData,
  getDB: getDB,
};
