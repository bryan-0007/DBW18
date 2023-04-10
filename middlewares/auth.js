function checkNotAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return res.redirect("/");
  }
  next();
}

function checkAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/login");
}

function checkNotAuthenticated_Home(req, res, next) {
  if (req.isAuthenticated()) {
    return res.redirect("/home_agente");
  }
  next();
}

function checkAuthenticated_Home(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/home");
}

function checkNotAuthenticated_Tickets(req, res, next) {
  if (req.isAuthenticated()) {
    return res.redirect("/tickets_agent");
  }
  next();
}

function checkAuthenticated_Tickets(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/tickets");
}

function checkNotAuthenticated_Chat(req, res, next) {
  if (req.isAuthenticated()) {
    return res.redirect("/atendimento_agente");
  }
  next();
}

function checkAuthenticated_Chat(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/atendimento");
}


function checkNotAuthenticated_Faq(req, res, next) {
  if (req.isAuthenticated()) {
    return res.redirect("/faq_agente");
  }
  next();
}

function checkAuthenticated_Faq(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/faq");
}

module.exports = {
  checkNotAuthenticated,
  checkAuthenticated,
  checkNotAuthenticated_Home,
  checkAuthenticated_Home,
  checkNotAuthenticated_Tickets,
  checkAuthenticated_Tickets,
  checkNotAuthenticated_Chat,
  checkAuthenticated_Chat,
  checkNotAuthenticated_Faq,
  checkAuthenticated_Faq, 
};
