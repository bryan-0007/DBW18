const mongoose = require("mongoose");

const faqSchema = new mongoose.Schema({
    Pergunta: {
        type: String,
    },
    Resposta: {
        type: String,
        required: true,
    },
    Categoria: {
        type: String,
        enum: ['Enviar', 'Receber', 'Pagamentos e Portagens', 'Transferência de dinheiro', 'Importações e desenfandegamento'],
        required: true,
    },
    Prioritário: {
        type: Boolean,
        default: false,
        required: true,
    },
    Ticket: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tickets",
    },
    Fechado: {
        type: Boolean,
        default: true,
        required: true,
    }
});

const FAQ = mongoose.model("FAQ", faqSchema);
module.exports = FAQ;
