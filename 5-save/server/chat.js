const base = require("./mongodb.js");
const users = require("./users.js");

// name;
// users = [];
// text = "";
//admins = ["Admin"];

async function find(name) {
  return base.getOneData("Chats", name);
}

async function create(name) {
  if ((await find("Chats", name)) == null) {
    await base.addData("Chats", {
      name: name,
      users: null,
      text: "",
    });
  }
}
async function addUser(chatName, userName) {
  let chat = await base.getDB("Chats");

  let res = await chat.find({
    $and: [{ name: chatName }, { users: { $all: [userName] } }],
  });
  if (res == null) return;

  await chat.updateOne({ name: chatName }, { $push: { users: userName } });
  let client = await users.findActive(userName);
  if (client != null) {
    let text = await chat.findOne({ name: chatName }, { text: 1 });
    client.emit("MessageFromServer", text, client.socket);
    return true;
  }
}
async function delUser(chatName, userName) {
  let chat = await base.getDB("Chats");
  chat.updateOne({ name: chatName }, { $pop: { users: userName } });

  return false;
}

async function textUpdate(chatName, autorName, newtext) {
  let resp = await base.getDB("Chats");
  let chat = await resp.findOne({ name: chatName });

  chat.text += newtext;
  for (let user of chat.users) {
    if (user === autorName) {
      continue;
    }
    let client = await users.findActive(user);
    client.emit("MessageFromServer", newtext, client.socket);
  }
  await chat.replaceOne({ name: chatName }, chat);
}

module.exports = {
  create: create,
  addUser: addUser,
  delUser: delUser,
  textUpdate: textUpdate,
};
