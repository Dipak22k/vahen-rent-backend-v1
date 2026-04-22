// socket/chatSocket.js

const Message = require("../models/Message");
const Chat = require("../models/Chat");

module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log("User Connected:", socket.id);



       // ============================
    // JOIN USER (WITH SECURITY)
    // ============================

    socket.on("join_user", (userId) => {
  socket.join(userId);
});


    // JOIN CHAT
    // ============================
    socket.on("join_chat", async (chatId) => {
      if (!chatId) return;

      socket.join(chatId);

      const chat = await Chat.findById(chatId);

      if (chat) {
        socket.emit("chat_status_updated", {
          chatId,
          status: chat.status,
          finalStatus: chat.finalStatus,
        });
      }
    });

    // ============================
    // SEND MESSAGE (WITH SECURITY)
    // ============================
    socket.on("send_message", async (data) => {
      try {
        const { chatId, senderId, type } = data;

        const chat = await Chat.findById(chatId);

        if (!chat) {
          return socket.emit("error", { message: "Chat not found" });
        }

        // ❌ Block if not accepted
        if (chat.status !== "accepted") {
          return socket.emit("error", {
            message: "Chat not allowed yet",
          });
        }

        // ❌ Block location before confirmation
        if (type === "location" && chat.finalStatus !== "confirmed") {
          return socket.emit("error", {
            message: "Location sharing not allowed yet",
          });
        }

        const message = await Message.create(data);

        io.to(chatId).emit("receive_message", message);
      } catch (err) {
        socket.emit("error", { message: "Message failed" });
      }
    });

    // ============================
    // ACCEPT / REJECT CHAT (ONLY LENDER)
    // ============================
    socket.on("update_chat_status", async ({ chatId, status, userId }) => {
      try {
        const chat = await Chat.findById(chatId);

        if (!chat) {
          return socket.emit("error", { message: "Chat not found" });
        }

        // 🔐 Only lender can update
        if (String(chat.lenderId) !== String(userId)) {
          return socket.emit("error", {
            message: "Only lender can update status",
          });
        }

        chat.status = status;
        await chat.save();

          io.to(chat.borrowerId.toString()).emit("chat_status_updated", {
          chatId: chat._id,
          status: chat.status,
        });

        io.to(chat.lenderId.toString()).emit("chat_status_updated", {
          chatId: chat._id,
          status: chat.status,
});
      } catch (err) {
        socket.emit("error", { message: "Update failed" });
      }
    });

    // ============================
    // FINAL RENT CONFIRMATION
    // ============================
    socket.on("confirm_rent", async ({ chatId, userId }) => {
      try {
        const chat = await Chat.findById(chatId);

        if (!chat) {
          return socket.emit("error", { message: "Chat not found" });
        }

        // 🔐 Only lender can confirm
        if (String(chat.lenderId) !== String(userId)) {
          return socket.emit("error", {
            message: "Only lender can confirm rent",
          });
        }

        chat.finalStatus = "confirmed";
        await chat.save();

        io.to(chatId).emit("rent_confirmed", {
          chatId,
          finalStatus: chat.finalStatus,
        });
      } catch (err) {
        socket.emit("error", { message: "Confirmation failed" });
      }
    });

    // ============================
    socket.on("disconnect", () => {
      console.log("User Disconnected");
    });
  });
};