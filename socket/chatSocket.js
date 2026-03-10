// socket/chatSocket.js

const Message = require("../models/Message");
const Chat = require("../models/Chat");

module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log("User Connected:", socket.id);

    // JOIN CHAT
    socket.on("join_chat", async (chatId) => {
      socket.join(chatId);

      const chat = await Chat.findById(chatId);

      if (chat) {
        socket.emit("chat_status_updated", {
          chatId,
          status: chat.status,
        });
      }
    });

    // SEND MESSAGE
    socket.on("send_message", async (data) => {
      const message = await Message.create(data);
      io.to(data.chatId).emit("receive_message", message);
    });

    // UPDATE STATUS (Accept / Reject)
    socket.on("update_chat_status", async ({ chatId, status }) => {
      const updatedChat = await Chat.findByIdAndUpdate(
        chatId,
        { status },
        { new: true }
      );
      socket.emit("send_message", {
  chatId,
  senderId,
  receiverId,
  type: "location",
  location: {
    lat,
    lng,
    address,
  },
});

      if (updatedChat) {
        io.to(chatId).emit("chat_status_updated", {
          chatId,
          status: updatedChat.status,
        });
      }
    });

    socket.on("disconnect", () => {
      console.log("User Disconnected");
    });
  });
};