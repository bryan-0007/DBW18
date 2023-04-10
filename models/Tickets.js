const mongoose = require("mongoose");

const ticketsSchema = new mongoose.Schema({
    Titulo: {
        type: String,
    },
    Descricao: {
        type: String,
        required: true,
    },
    Resposta: {
        type: String,
    },
    Faq: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "FAQ",
    },
    Agente: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    Fechado: {
        type: Boolean,
        default: false,
        required: true,
    }
});

const Tickets = mongoose.model("Tickets", ticketsSchema);
module.exports = Tickets;
