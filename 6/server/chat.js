// /* eslint-disable no-undef */
// const base = require("./mongodb.js");
// const users = require("./users.js");

// // name;
// // users = [];
// // text = "";
// //admins = ["Admin"];

// async function find(name) {
//   return base.getOneData("Chats", name);
// }

// async function create(name) {
//   if ((await find("Chats", name)) == null) {
//     await base.addData("Chats", {
//       name: name,
//       users: [],
//       messanges: [],
//     });
//   }
// }
// async function addUser(chatName, userName) {
//   let resp = await base.getDB("Chats");
//   let chat = await resp.findOne({ name: chatName });

//   if (chat.users.indexOf(userName) < 0) {
//     chat.users.push(userName);
//     await resp.replaceOne({ name: chatName }, chat);
//   }
//   let client = await users.findActive(userName);

//   client.socket.emit("addToChat-Client", chatName, chat.messanges.slice(-10));
//   return true;
//   // let res = await chat
//   //   .find({
//   //     $and: [{ name: chatName }, { users: { $all: [userName] } }],
//   //   })
//   //   .toArray();
//   // if (res != []) return;

//   // await chat.updateOne({ name: chatName }, { $push: { users: userName } });
//   // let client = await users.findActive(userName);
//   // if (client != null) {
//   //   let text = await chat.findOne({ name: chatName });
//   //   client.socket.emit("addToChat-Client", chatName, text.text);
//   //   return true;
//   // }
// }
// async function delUser(chatName, userName) {
//   let resp = await base.getDB("Chats");
//   resp.updateOne({ name: chatName }, { $pop: { users: userName } });

//   return false;
// }

// async function update(chatName, socketAutor, newtext) {
//   let resp = await base.getDB("Chats");
//   let chat = await resp.findOne({ name: chatName });

//   chat.messanges.push(newtext);
//   for (let user of chat.users) {
//     let client = await users.findActive(user);
//     if (client == null) continue;
//     if (client.socket == socketAutor) continue;
//     client.socket.emit("updateChat-User", chat.name, newtext);
//   }
//   await resp.replaceOne({ name: chatName }, chat);
// }

// module.exports = {
//   create: create,
//   addUser: addUser,
//   delUser: delUser,
//   update: update,
// };
