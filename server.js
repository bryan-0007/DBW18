require("dotenv").config(); // permite aramzenar variáveis de ambiente(environment) num ficheiro .env, na qual podemos carregar no servidor

const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const mongoose = require("mongoose"); // para criar uma base de dados e meter um esquema dessa bd em um objeto string

// Para podermos usar as imagens da pasta img temos de torna-la estatica
app.use(express.static("img"));

//-----------------------------------LOGIN-----------------------------------------------

const passport = require("passport"); // para autenticação
const flash = require("express-flash"); //exibir erros na introdução dos dados em login ou sign up
const session = require("express-session"); // permite a criação de uma sessão que permite guardar os dados do utlizador que fez login na sessão
const methodOverride = require("method-override"); // para podermos utilizar HTTP methods como "put" ou "delete" onde o cliente não suporta, neste caso vou utilizar para apagar a rota "/logout", a propridade req.user e vai limpar a sessão login, em index.ejs ao carregar em LOGOUT

const User = require("./models/User"); // esquema da bd com os dados do utilizador
const FAQ = require("./models/FAQ");
const Tickets = require("./models/Tickets");

const bcrypt = require("bcryptjs"); // para encriptar através de hash, neste caso, na password

const {
    checkAuthenticated,
    checkNotAuthenticated,
    checkNotAuthenticated_Home,
    checkAuthenticated_Home,
    checkAuthenticated_Tickets,
    checkNotAuthenticated_Tickets,
    checkAuthenticated_Chat,
    checkNotAuthenticated_Chat,
    checkNotAuthenticated_Faq,
    checkAuthenticated_Faq,
} = require("./middlewares/auth"); // permite a utilização dos metemos do ficheiro auth

// Passport config
const initializePassport = require("./passport-config");
initializePassport(
    passport,
    async (email) => {
        const userFound = await User.findOne({ email });
        return userFound;
    },
    async (id) => {
        const userFound = await User.findOne({ _id: id });
        return userFound;
    }
);

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: false })); // basicamente igual ao body-parser
app.use(flash());

const sessionMiddleware = session({
    secret: process.env.SESSION_SECRET, // vai usar a a sessão secreta do .env
    resave: false, // caso queira voltar a guardar os mesmos dados
    saveUninitialized: false, // caso queira guardar dados vazios
    //useFindModify: false,
});

app.use(sessionMiddleware);
app.use(passport.initialize());
app.use(passport.session());

app.use(methodOverride("_method"));
app.use(express.static("public"));

//--------------------Get Request para faq, atendimento, home, login, register-------------

app.get("/ticket_update/:id", checkAuthenticated, async (req, res) => {
    var agente_email = await User.find(); 
    const ticket = await Tickets.findById(req.params.id).populate("Agente");
    const n_tickets_por_responder = await Tickets.findOne({
        Fechado: false,
    }).countDocuments();
    res.render("ticket_update", {
        n_tickets_por_responder: n_tickets_por_responder,
        ticket: ticket,
        agentes: agente_email, 
    });
});

app.get("/faq_update/:id", checkAuthenticated_Faq, async (req, res) => {
    const faq = await FAQ.findById(req.params.id);
    const n_tickets_por_responder = await Tickets.findOne({
        Fechado: false,
    }).countDocuments();
    res.render("faq_update", {
        n_tickets_por_responder: n_tickets_por_responder,
        faq: faq,
    });
});

app.get("/", checkAuthenticated, async (req, res) => {
    const agente_mensagens = await User.findById(req.user.id) 
    const respostaFaqs = await FAQ.find({})
    const respostaTickets = await Tickets.find({})
    const n_tickets = await Tickets.find({
        Agente: req.user.id,
        Fechado: true,
    }).countDocuments();
    const n_tickets_por_responder = await Tickets.find({
        Fechado: false,
    }).countDocuments();
    const tickets_fechados = await Tickets.find({
        Agente: req.user.id,
        Fechado: true,
    }).populate("Agente");
    const tickets_abertos = await Tickets.find({
        Fechado: false,
    }).populate("Agente");
    res.render("index", {
        name: req.user.name,
        email: req.user.email,
        n_tickets_agente: n_tickets,
        n_tickets_por_responder: n_tickets_por_responder,
        tickets_fechados: tickets_fechados,
        tickets_abertos: tickets_abertos,
        respostasdasFaqs:respostaFaqs,
        respostaTickets2: respostaTickets,
        agente: agente_mensagens.Mensagens,
    }); // vai buscar o nome criado no registo e que vou guardado na bd e introduzi-lo a um objeto json, de modo, a que possamos reutiliza-lo.
});

app.get("/login", checkNotAuthenticated, (req, res) => {
    res.render("login");
});

app.get("/register", checkNotAuthenticated, (req, res) => {
    res.render("register");
});

app.get("/home", checkNotAuthenticated_Home, (req, res) => {
    res.render("home");
});

app.get("/home_agente", checkAuthenticated_Home, async (req, res) => {
    const n_tickets_por_responder = await Tickets.findOne({
        Fechado: false,
    }).countDocuments();
    res.render("home_agente", {
        n_tickets_por_responder: n_tickets_por_responder,
    });
});

app.get("/faq", checkNotAuthenticated_Faq, async (req, res) => {
    var faqs_todas_enviar = await FAQ.find({
        Categoria: "Enviar",
        Fechado: true,
    }).sort({
        Prioritário: -1,
    });
    var faqs_todas_receber = await FAQ.find({
        Categoria: "Receber",
        Fechado: true,
    }).sort({
        Prioritário: -1,
    });
    var faqs_todas_Pp = await FAQ.find({
        Categoria: "Pagamentos e Portagens",
        Fechado: true,
    }).sort({ Prioritário: -1 });
    var faqs_todas_transferencia = await FAQ.find({
        Categoria: "Transferência de dinheiro",
        Fechado: true,
    }).sort({ Prioritário: -1 });
    var faqs_todas_importacoes = await FAQ.find({
        Categoria: "Importações e desenfandegamento",
        Fechado: true,
    }).sort({ Prioritário: -1 });

    res.render("faq", {
        faqs: faqs_todas_enviar,
        faqs1: faqs_todas_receber,
        faqs2: faqs_todas_Pp,
        faqs3: faqs_todas_transferencia,
        faqs4: faqs_todas_importacoes,
    });
});

app.get("/faq_agente", checkAuthenticated_Faq, async (req, res) => {
    const n_tickets_por_responder = await Tickets.findOne({
        Fechado: false,
    }).countDocuments();
    var faqs_todas_enviar = await FAQ.find({
        Categoria: "Enviar",
        Fechado: true,
    }).sort({
        Prioritário: -1,
    });
    var faqs_todas_receber = await FAQ.find({
        Categoria: "Receber",
        Fechado: true,
    }).sort({
        Prioritário: -1,
    });
    var faqs_todas_Pp = await FAQ.find({
        Categoria: "Pagamentos e Portagens",
        Fechado: true,
    }).sort({ Prioritário: -1 });
    var faqs_todas_transferencia = await FAQ.find({
        Categoria: "Transferência de dinheiro",
        Fechado: true,
    }).sort({ Prioritário: -1 });
    var faqs_todas_importacoes = await FAQ.find({
        Categoria: "Importações e desenfandegamento",
        Fechado: true,
    }).sort({ Prioritário: -1 });

    var faqs_todas_enviar_aberto = await FAQ.find({
        Categoria: "Enviar",
        Fechado: false,
    }).sort({
        Prioritário: -1,
    });
    var faqs_todas_receber_aberto = await FAQ.find({
        Categoria: "Receber",
        Fechado: false,
    }).sort({
        Prioritário: -1,
    });
    var faqs_todas_Pp_aberto = await FAQ.find({
        Categoria: "Pagamentos e Portagens",
        Fechado: false,
    }).sort({ Prioritário: -1 });
    var faqs_todas_transferencia_aberto = await FAQ.find({
        Categoria: "Transferência de dinheiro",
        Fechado: false,
    }).sort({ Prioritário: -1 });
    var faqs_todas_importacoes_aberto = await FAQ.find({
        Categoria: "Importações e desenfandegamento",
        Fechado: false,
    }).sort({ Prioritário: -1 });

    res.render("faq_agente", {
        faqs: faqs_todas_enviar,
        faqs1: faqs_todas_receber,
        faqs2: faqs_todas_Pp,
        faqs3: faqs_todas_transferencia,
        faqs4: faqs_todas_importacoes,
        faqs_aberto: faqs_todas_enviar_aberto,
        faqs_aberto1: faqs_todas_receber_aberto,
        faqs_aberto2: faqs_todas_Pp_aberto,
        faqs_aberto3: faqs_todas_transferencia_aberto,
        faqs_aberto4: faqs_todas_importacoes_aberto,
        n_tickets_por_responder: n_tickets_por_responder,
    });
});

app.get("/faq_create", checkAuthenticated_Faq, async (req, res) => {
    var agente_email = await User.find();
    const n_tickets_por_responder = await Tickets.findOne({
        Fechado: false,
    }).countDocuments();
    res.render("faq_create", {
        n_tickets_por_responder: n_tickets_por_responder,
        agentes: agente_email,
    });
});

app.get("/atendimento", checkNotAuthenticated_Chat, async (req, res) => {
    var agente_email = await User.find();
    res.render("atendimento", {
        n_logados: n_logados.length,
        agentes: agente_email,
    });
});

app.get("/atendimento_agente", checkAuthenticated_Chat, async (req, res) => {
    const n_tickets_por_responder = await Tickets.findOne({
        Fechado: false,
    }).countDocuments();
    var agente_email = await User.find();
    var agente = await User.findOne({ name: req.user.name });
    res.render("atendimento_agente", {
        name: req.user.name,
        n_logados: n_logados.length,
        agentes: agente_email,
        mensagens: agente.Mensagens,
        n_tickets_por_responder: n_tickets_por_responder,
    });
});

app.get("/tickets", checkNotAuthenticated_Tickets, async (req, res) => {
    var agente_email = await User.find();
    res.render("tickets", { agentes: agente_email });
});

app.get("/tickets_agent", checkAuthenticated_Tickets, async (req, res) => {
    var agente_email = await User.find();
    const n_tickets_por_responder = await Tickets.findOne({
        Fechado: false,
    }).countDocuments();
    res.render("tickets_agent", {
        agentes: agente_email,
        n_tickets_por_responder: n_tickets_por_responder,
    });
});
////--------------------Post Request para faq, atendimento, home, login, register-------------

app.post("/", checkAuthenticated, async (req, res) => {
    if (req.body.fuiFaq == undefined && req.body.fuiTicket == undefined) {
        await User.findOneAndUpdate(
            {
                name: req.user.name,
            },
            {
                $push: {
                    Mensagens: req.body.mensagens,
                },
            },
            
        );
        res.redirect("/");
    }

    if (req.body.fuiFaq == undefined && req.body.mensagens == "") {
        await User.findOneAndUpdate(
            {
                name: req.user.name,
            },
            {
                $push: {
                    Mensagens: req.body.fuiTicket,
                },
            },
            
        );
        res.redirect("/");
    }

    if (req.body.fuiTicket == undefined && req.body.mensagens == "") {
        await User.findOneAndUpdate(
            {
                name: req.user.name,
            },
            {
                $push: {
                    Mensagens: req.body.fuiFaq,
                },
            },
            
        );
        res.redirect("/");
    }
});

app.post(
    "/login",
    checkNotAuthenticated,
    passport.authenticate("local", {
        successRedirect: "/", // se login for efetuado com sucesso, o user vai ser redirecionado para a rota "/"
        failureRedirect: "/login", // se login tiver algum erro, o user vai ser redirecionado para a rota "/login"
        failureFlash: true,
    })
);

app.post("/register", checkNotAuthenticated, async (req, res) => {
    const userFound = await User.findOne({ email: req.body.email }); // a userFound vai ser atribuido o email introduzido no registo
    if (userFound) {
        req.flash("error", "*User with that email already exists");
        res.redirect("/register");
    } else {
        try {
            const hashedPassword = await bcrypt.hash(req.body.password, 10); // bcrypt permite a encriptação da palavra-passe, na qual vai ser encriptada dez vezes
            const user = new User({
                // atribuir o name, email e password no objeto User(esquema do mongodb da bd auth); que foram introduzidos no registo; nos seus correspondentes
                name: req.body.name,
                email: req.body.email,
                password: hashedPassword,
            });
            await user.save(); // guardar o user na bd auth
            res.redirect("/login");
        } catch (error) {
            console.log(error);
            res.redirect("/register");
        }
    }
});

app.post("/faq_update/:id", checkAuthenticated_Faq, async (req, res) => {
    const faq_anterior = await FAQ.findById(req.params.id);
    const agente = await User.findOne({ Faq: { $all: [faq_anterior] } })
    if (req.body.Pergunta != "") {
        await FAQ.findOneAndReplace(
            { _id: req.params.id },
            {
                Prioritário: faq_anterior.Prioritário,
                Pergunta: req.body.Pergunta,
                Resposta: req.body.Resposta,
                Categoria: req.body.Categoria,
                Ticket: faq_anterior.Ticket,
                Fechado: true,
            },
            { upsert: true }
        );
    } else {
        await FAQ.findOneAndReplace(
            { _id: req.params.id },
            {
                Prioritário: faq_anterior.Prioritário,
                Resposta: req.body.Resposta,
                Categoria: req.body.Categoria,
                Ticket: faq_anterior.Ticket,
                Fechado: false,
            },
            { upsert: true }
        );
    }
    if (agente.email != req.user.email) {
        await User.findOneAndUpdate(
            { email: agente.email },
            {
                $pull: {
                    Faq: req.params.id,
                }
            },
            { upsert: true },
        )
        await User.findOneAndUpdate(
            { email: req.user.email },
            {
                $push: {
                    Faq: req.params.id,
                }
            },
            { upsert: true },
        )
    }
    res.redirect("/faq_agente");
});

app.post("/ticket_update/:id", checkAuthenticated, async (req, res) => {
    var agente_ticket = await User.findOne({ Tickets: { $all: [req.params.id] } })
    var ticket_anterior = await Tickets.findById(req.params.id)
    var agente;
    if (req.body.Resposta != "" && req.body.Resposta != undefined) {
        console.log("aqui 1")
        agente = await User.findOne({ email: req.body.Agente });
        await Tickets.findOneAndUpdate(
            { _id: req.params.id },
            {
                Titulo: req.body.Titulo,
                Resposta: req.body.Resposta,
                Descricao: req.body.Descricao,
                Agente: agente._id,
                Fechado: true,
            },
            { upsert: true },
        )
        if (agente_ticket == null) {
            await User.findOneAndUpdate(
                { email: req.body.Agente },
                {
                    $push: {
                        Ticket: req.params.id,
                    }
                },
                { upsert: true },
            )
        }
        else if (agente_ticket.email != req.body.Agente) {
            await User.findOneAndUpdate(
                { email: agente_ticket.email },
                {
                    $pull: {
                        Ticket: req.params.id,
                    }
                },
                { upsert: true },
            )
            await User.findOneAndUpdate(
                { email: req.body.Agente },
                {
                    $push: {
                        Ticket: req.params.id,
                    }
                },
                { upsert: true },
            )
        }
    } else if (req.body.Resposta == "" && (req.body.Agente == undefined || req.body.Agente == "")) {
        console.log("aqui 2")
        if (req.body.Titulo == "") {
            if (ticket_anterior.Agente != null) {
                await Tickets.findOneAndUpdate(
                    { _id: req.params.id },
                    {
                        Titulo: req.body.Titulo,
                        Descricao: req.body.Descricao,
                        $unset: {
                            Resposta: req.body.Resposta,
                        },
                        Fechado: false,
                        $unset: {
                            Agente: ticket_anterior.Agente,
                        },
                    },
                    { upsert: true },
                )
                if (agente_ticket != null) {
                    if (agente_ticket.email != req.body.Agente) {
                        await User.findOneAndUpdate(
                            { email: agente_ticket.email },
                            {
                                $pull: {
                                    Ticket: req.params.id,
                                }
                            },
                            { upsert: true },
                        )
                    }
                }
            }
            else {
                await Tickets.findOneAndUpdate(
                    { _id: req.params.id },
                    {
                        Titulo: req.body.Titulo,
                        Descricao: req.body.Descricao,
                        $unset: {
                            Resposta: req.body.Resposta,
                        },
                        Fechado: false,
                    },
                    { upsert: true },
                )
            }
        } else {
            if (ticket_anterior.Agente != null) {
                await Tickets.findOneAndUpdate(
                    { _id: req.params.id },
                    {
                        Titulo: req.body.Titulo,
                        Descricao: req.body.Descricao,
                        $unset: {
                            Resposta: req.body.Resposta,
                        },
                        Fechado: false,
                        $unset: {
                            Agente: ticket_anterior.Agente,
                        },
                    },
                    { upsert: true },
                )
                if (agente_ticket != null) {
                    if (agente_ticket.email != req.body.Agente) {
                        await User.findOneAndUpdate(
                            { email: agente_ticket.email },
                            {
                                $pull: {
                                    Ticket: req.params.id,
                                }
                            },
                            { upsert: true },
                        )
                    }
                }
            }
            else {
                await Tickets.findOneAndUpdate(
                    { _id: req.params.id },
                    {
                        Titulo: req.body.Titulo,
                        Descricao: req.body.Descricao,
                        $unset: {
                            Resposta: req.body.Resposta,
                        },
                        Fechado: false,
                    },
                    { upsert: true },
                )
            }
        }
    }
    else if (req.body.Resposta == "" && (req.body.Agente != "" && req.body.Agente != undefined)) {
        console.log("aqui 3")
        if (req.body.Titulo == "" || req.body.Titulo == undefined) {
            agente = await User.findOne({ email: req.body.Agente });
            await Tickets.findOneAndUpdate(
                { _id: req.params.id },
                {
                    Descricao: req.body.Descricao,
                    Agente: agente._id,
                    $unset: {
                        Resposta: req.body.Resposta,
                    },
                    Fechado: false,
                },
                { upsert: true },
            );
            if (agente_ticket == null) {
                await User.findOneAndUpdate(
                    { email: req.body.Agente },
                    {
                        $push: {
                            Ticket: req.params.id,
                        }
                    },
                    { upsert: true },
                )
            }
            else if (agente_ticket.email != req.body.Agente) {
                await User.findOneAndUpdate(
                    { email: agente_ticket.email },
                    {
                        $pull: {
                            Ticket: req.params.id,
                        }
                    },
                    { upsert: true },
                )
                await User.findOneAndUpdate(
                    { email: req.body.Agente },
                    {
                        $push: {
                            Ticket: req.params.id,
                        }
                    },
                    { upsert: true },
                )
            }
        } else {
            agente = await User.findOne({ email: req.body.Agente });
            await Tickets.findOneAndUpdate(
                { _id: req.params.id },
                {
                    Descricao: req.body.Descricao,
                    Agente: agente._id,
                    $unset: {
                        Resposta: req.body.Resposta,
                    },
                    Fechado: false,
                },
                { upsert: true },
            );
            if (agente_ticket == null) {
                await User.findOneAndUpdate(
                    { email: req.body.Agente },
                    {
                        $push: {
                            Ticket: req.params.id,
                        }
                    },
                    { upsert: true },
                )
            }
            else if (agente_ticket.email != req.body.Agente) {
                await User.findOneAndUpdate(
                    { email: agente_ticket.email },
                    {
                        $pull: {
                            Ticket: req.params.id,
                        }
                    },
                    { upsert: true },
                )
                await User.findOneAndUpdate(
                    { email: req.body.Agente },
                    {
                        $push: {
                            Ticket: req.params.id,
                        }
                    },
                    { upsert: true },
                )
            }
        }
    }
    res.redirect("/");
});

app.post("/pinned/:id", checkAuthenticated_Faq, async (req, res) => {
    const id = req.params.id;
    const faq = await FAQ.findById(id);
    if (faq.Prioritário == false) {
        await FAQ.findOneAndReplace(
            { _id: id },
            {
                Prioritário: true,
                Pergunta: faq.Pergunta,
                Resposta: faq.Resposta,
                Categoria: faq.Categoria,
                Ticket: faq.Ticket,
            },
            
        );
        res.redirect("/faq_agente");
    } else {
        await FAQ.findOneAndReplace(
            { _id: id },
            {
                Prioritário: false,
                Pergunta: faq.Pergunta,
                Resposta: faq.Resposta,
                Categoria: faq.Categoria,
                Ticket: faq.Ticket,
            },
            
        );
        res.redirect("/faq_agente");
    }
});

app.post("/profile", async (req, res) => {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    await User.findOneAndUpdate(
        {
            name: req.user.name,
        },
        {
            name: req.body.name,
            email: req.body.email,
            password: hashedPassword,
        }
    );
    res.redirect("/");
});

app.post("/tickets", checkNotAuthenticated_Tickets, async (req, res) => {
    if (req.body.Agente != "") {
        if (req.body.Titulo != "") {
            const Agente_email = await User.findOne({ email: req.body.Agente });
            const ticket = new Tickets({
                Titulo: req.body.Titulo,
                Descricao: req.body.Descricao,
                Agente: Agente_email.id,
            });
            await ticket.save();
        } else {
            const ticket = new Tickets({
                Titulo: req.body.Titulo,
                Descricao: req.body.Descricao,
                Agente: Agente_email.id,
            });
            await ticket.save();
        }
        const Agente_ticket = await User.findOneAndUpdate(
            {
                email: req.body.Agente,
            },
            {
                Tickets: ticket._id,
            },
        );
    }
    else {
        if (req.body.Titulo != "") {
            const Agente_email = await User.findOne({ email: req.body.Agente });
            const ticket = new Tickets({
                Titulo: req.body.Titulo,
                Descricao: req.body.Descricao,
            });
            await ticket.save();
        } else {
            const ticket = new Tickets({
                Titulo: req.body.Titulo,
                Descricao: req.body.Descricao,
            });
            await ticket.save();
        }
    }
    res.redirect("/tickets");
});

app.post("/faq_create", checkAuthenticated_Tickets, async (req, res) => {
    var faq;
    if (req.body.Pergunta == "") {
        faq = new FAQ({
            Resposta: req.body.Resposta,
            Categoria: req.body.Categoria,
            Fechado: false,
        });
        await faq.save();
    } else {
        faq = new FAQ({
            Pergunta: req.body.Pergunta,
            Resposta: req.body.Resposta,
            Categoria: req.body.Categoria,
        });
        await faq.save();
    }
    if (faq.Fechado == true) {
        await User.findOneAndUpdate(
            {
                email: req.user.email,
            },
            {
                $push: {
                    Faq: faq._id,
                },
            },
            
        );
    }
    res.redirect("/faq_agente");
});

app.post("/tickets_agent", checkAuthenticated_Tickets, async (req, res) => {
    var Agente_email;
    if (req.body.Agente != "") {
        Agente_email = await User.findOne({ email: req.body.Agente });
    }
    var ticket;
    if (req.body.Titulo != "") {
        if (req.body.Resposta == "") {
            if (req.body.Agente == undefined) {
                ticket = new Tickets({
                    Descricao: req.body.Descricao,
                });
                await ticket.save();
            } else {
                ticket = new Tickets({
                    Descricao: req.body.Descricao,
                    Agente: Agente_email.id,
                });
                await ticket.save();
            }
        } else if (req.body.Resposta != "" && req.body.Agente != undefined) {
            ticket = new Tickets({
                Descricao: req.body.Descricao,
                Resposta: req.body.Resposta,
                Agente: Agente_email.id,
                Fechado: true,
            });
            await ticket.save();
        }
        await User.findOneAndUpdate(
            {
                email: req.body.Agente,
            },
            {
                $push: {
                    Tickets: ticket._id,
                },
            },
        );
        console.log("New ticket created by", req.user.name);
        if (req.body.FAQ == "checked") {
            var faq = new FAQ({
                Resposta: req.body.Resposta,
                Categoria: req.body.Categoria,
                Ticket: ticket._id,
            });
            await faq.save();
            await Tickets.findOneAndUpdate(
                {
                    _id: ticket._id,
                },
                {
                    $push: {
                        Faq: faq._id,
                    },
                },
            
            );
            await User.findOneAndUpdate(
                {
                    email: req.body.Agente,
                },
                {
                    $push: {
                        Faq: faq._id,
                    },
                },
            
            );
        }
    } else {
        if (req.body.Resposta == "") {
            if (req.body.Agente == undefined) {
                ticket = new Tickets({
                    Titulo: req.body.Titulo,
                    Descricao: req.body.Descricao,
                });
                await ticket.save();
            } else {
                ticket = new Tickets({
                    Titulo: req.body.Titulo,
                    Descricao: req.body.Descricao,
                    Agente: Agente_email.id,
                });
                await ticket.save();
            }
        } else if (req.body.Resposta != "" && req.body.Agente != undefined) {
            ticket = new Tickets({
                Titulo: req.body.Titulo,
                Descricao: req.body.Descricao,
                Resposta: req.body.Resposta,
                Agente: Agente_email.id,
                Fechado: true,
            });
            await ticket.save();
        }
        await User.findOneAndUpdate(
            {
                email: req.body.Agente,
            },
            {
                $push: {
                    Tickets: ticket._id,
                },
            },
        );
        console.log("New ticket created by", req.user.name);
        if (req.body.FAQ == "checked") {
            var faq = new FAQ({
                Pergunta: req.body.Titulo,
                Resposta: req.body.Resposta,
                Categoria: req.body.Categoria,
                Ticket: ticket._id,
            });
            await faq.save();
            await Tickets.findOneAndUpdate(
                {
                    _id: ticket._id,
                },
                {
                    $push: {
                        Faq: faq._id,
                    },
                },
            
            );
            await User.findOneAndUpdate(
                {
                    email: req.body.Agente,
                },
                {
                    $push: {
                        Faq: faq._id,
                    },
                },
            
            );
        }
    }
    res.redirect("/tickets_agent");
});

app.post(
    "/atendimento_agente_tickets",
    checkAuthenticated_Chat,
    async (req, res) => {
        console.log(req.body.Agente)
        if (req.body.Agente == "" || req.body.Agente == undefined){
            if (req.body.Titulo != "") {
                const ticket = new Tickets({
                    Titulo: req.body.Titulo,
                    Descricao: req.body.Descricao,
                });
                await ticket.save();
            } else {
                const ticket = new Tickets({
                    Descricao: req.body.Descricao,
                });
                await ticket.save();
            }
            console.log("New ticket was created");
        }
        else{
            const Agente_email = await User.findOne({ email: req.body.Agente });
            if (req.body.Titulo != "") {
                const ticket = new Tickets({
                    Titulo: req.body.Titulo,
                    Descricao: req.body.Descricao,
                    Agente: Agente_email._id,
                });
                await ticket.save();
            } else {
                const ticket = new Tickets({
                    Descricao: req.body.Descricao,
                    Agente: Agente_email._id,
                });
                await ticket.save();
            }
            const Agente_ticket = await User.findOneAndUpdate(
                {
                    email: req.body.Agente,
                },
                {
                    $push: {
                        Tickets: ticket._id,
                    },
                },
            );
            console.log("New ticket created by", req.user.name);
        }
        res.redirect("/atendimento_agente");
    }
);

app.post(
    "/atendimento_agente_faq",
    checkAuthenticated_Chat,
    async (req, res) => {
        if (req.body.Pergunta == "") {
            var faq = new FAQ({
                Resposta: req.body.Resposta,
                Categoria: req.body.Categoria,
                Fechado: false,
            });
            await faq.save();
        } else {
            var faq = new FAQ({
                Pergunta: req.body.Pergunta,
                Resposta: req.body.Resposta,
                Categoria: req.body.Categoria,
            });
            await faq.save();
        }
        const Agente_faq = await User.findOneAndUpdate(
            {
                email: req.user.email,
            },
            {
                $push: {
                    Faq: faq._id,
                },
            },
            
        );
        console.log("New faq created by", req.user.name);
        res.redirect("/atendimento_agente");
    }
);

//--------------------PUT e Delete Request para faq, atendimento, home, login, register-------------

app.delete("/logout", (req, res) => {
    req.logout(function(err) { //Passport exposes a logout() function on req (also aliased as logOut()) that can be called from any route handler which needs to terminate a login session. Invoking logout() will remove the req.user property and clear the login session (if any).
        if (err) { return next(err); }
    });
    res.redirect("/login");
});

app.delete("/:id", checkAuthenticated_Faq, async (req, res) => {
    const faq = await FAQ.findById(req.params.id);
    const agente = await User.findOne({ Faq: { $all: [req.params.id] } });
    await User.findOneAndUpdate(
        {
            name: agente.name,
        },
        {
            $pull: {
                Faq: req.params.id,
            },
        },
        { upsert: true }
    );
    if (faq.Ticket != null) {
        await Tickets.findByIdAndUpdate(
            faq.Ticket,
            {
                $pull: {
                    Faq: faq._id,
                },
            },
            { upsert: true }
        );
    }
    await FAQ.findByIdAndRemove(req.params.id);
    res.redirect("/faq_agente");
});

app.delete("/deleteTicket/:id", checkAuthenticated, async (req, res) => {

    var ticket = await Tickets.findById(req.params.id);
    const agente = await User.findOne({ Tickets: { $all: [req.params.id] } });
    if (agente != null) {
        await User.findOneAndUpdate(
            {
                name: agente.name,
            },
            {
                $pull: {
                    Tickets: req.params.id,
                },
            },
            { upsert: true }
        );
    }
    if (ticket.Faq != null) {
        await FAQ.findOneAndUpdate(
            {
                _id: ticket.Faq,
            },
            {
                $unset: {
                    Ticket: req.params.id,
                }
            },
            { upsert: true }
        )
    }
    await Tickets.findByIdAndRemove(req.params.id);
    res.redirect("/");
});

app.delete("/deleteMensagem/:id", checkAuthenticated, async (req, res) => {
    await User.findOneAndUpdate(
            {
                name: req.user.name,
            },
            {
                $pull: {
                    Mensagens: req.params.id,
                },
            },
            
        );
    res.redirect("/");
});

//---------------------------------------------ATENDIMENTO--------------------
const users = {};
const todas_as_mensagens = [];
const n_logados = [];
//const admins=[];

const wrap = (middleware) => (socket, next) =>
    middleware(socket.request, {}, next);

io.use(wrap(sessionMiddleware));
io.use(wrap(passport.initialize()));
io.use(wrap(passport.session()));

io.on("connection", function (socket) {
    socket.on("send-chat-message", (message) => {
        socket.broadcast.emit("chat-message", {
            message: message,
            name: users[socket.id],
        });
        todas_as_mensagens.push(message); // esta a guardar todas as mensagens enviadas por todos os utilizadores num array
        console.log(`${users[socket.id]} escreveu no chat`);
    });

    socket.on("new-user", (nome) => {
        users[socket.id] = nome;
        socket.broadcast.emit("user-conection", users[socket.id]);
        console.log(`O cliente ${users[socket.id]} entrou no chat`);
    });

    socket.on("new-agente", (nome) => {
        nome = socket.request.user.name;
        users[socket.id] = socket.request.user.name;
        n_logados.push(users[socket.id]);
        socket.broadcast.emit("user-conection", users[socket.id]);
        console.log(`O agente ${users[socket.id]} entrou no chat`);
    });

    socket.on("disconnect", () => {
        socket.broadcast.emit("user-disconected", users[socket.id]);
        for (i = 0; i < n_logados.length; i++) {
            if (n_logados[i] == users[socket.id]) {
                n_logados.pop(users[socket.id]);
            }
        }
        console.log(`${users[socket.id]} saiu do chat`);
        delete users[socket.id];
    });
});

//----------------------------------------MONGOOSE-----------------------------------------------------

mongoose
    .connect("mongodb+srv://DBW18:bmZCAJwVsYyR33xa@clusterdbw.1dbjr.mongodb.net/DBW18?authSource=admin&replicaSet=atlas-bek8xj-shard-0&w=majority&readPreference=primary&appname=Mongo", {
        useUnifiedTopology: true,
        useNewUrlParser: true,
        useFindAndModify: false,
    })
    .then(() => {
        server.listen(3000, () => {
            console.log("Server is running on Port 3000");
        });
    });

// pass da conta admin: 123
// pass da conta josefa: josefa

// mongodb+srv://DBW18:bmZCAJwVsYyR33xa@clusterdbw.1dbjr.mongodb.net/DBW18?authSource=admin&replicaSet=atlas-bek8xj-shard-0&w=majority&readPreference=primary&appname=Mongo
// mongodb://localhost:27017/auth