const express = require("express");
// yarn add uuid
const { v4: uuidv4 } = require("uuid");
const app = express();
const customers = [];

app.use(express.json());

/*
 * cpf - string
 * name - string
 * id - uuid
 * statement []
 */

// some => retorna true ou false, se existe ou não
// find => retorna a informação completa do objeto

// Middleware
function verifyIsExistsAccountCPF(request, response, next) {
  const { cpf } = request.headers;

  const customer = customers.find((customer) => customer.cpf === cpf);

  if (!customer)
    return response.status(400).json({ error: "Customer not found" });

  request.customer = customer;

  return next();
}

function getBalance(statement) {
  const balance = statement.reduce((acc, operation) => {
    if (operation === "credit") return acc + operation.amount;
    else if (operation === "debit") return acc - operation.amount;
  }, 0);
  return balance;
}

// Quando for usar o middleware em tudo, chame-o assim:
// app.use(verifyIsExistsAccountCPF);

app.post("/account", (request, response) => {
  const { cpf, name } = request.body;

  const customerAlreadyExists = customers.some(
    (customer) => customer.cpf === cpf
  );

  if (customerAlreadyExists) {
    return response.status(400).json({ error: "Customer already exists!" });
  }

  customers.push({
    cpf,
    name,
    id: uuidv4(),
    statement: [],
  });

  return response.status(201).send();
});

// Quando for usar o middleware em apenas algumas funções, chame-o assim:
app.get("/statement", verifyIsExistsAccountCPF, (request, response) => {
  const { customer } = request;
  return response.json(customer.statement);
});

app.post("/deposit", verifyIsExistsAccountCPF, (request, response) => {
  const { description, amount } = request.body;

  const { customer } = request;

  const statementOperation = {
    description,
    amount,
    created_at: new Date(),
    type: "credit",
  };

  customer.statement.push(statementOperation);

  return response.status(201).send();
});

app.post("/withdraw", verifyIsExistsAccountCPF, (request, response) => {
  const { amount } = request.body;
  const { customer } = request;

  const balance = getBalance(customer.statement);

  if (balance < amount)
    return response.status(400).json({ error: "Insufficient funds!" });

  const statementOperation = {
    amount,
    created_at: new Date(),
    type: "debit",
  };

  customer.statement.push(statementOperation);
  return response.status(201).send();
});

app.get("/statement/date", verifyIsExistsAccountCPF, (request, response) => {
  const { customer } = request;
  const { date } = request.query;

  const dateFormat = new Date(date + " 00:00");

  const statement = customer.statement.filter(
    (statement) =>
      statement.created_at.toDateString() ===
      new Date(dateFormat).toDateString()
  );

  return response.json(statement);
});

app.put("/account", verifyIsExistsAccountCPF, (request, response) => {
  const { name } = request.body;
  const { customer } = request;

  customer.name = name;

  return response.status(201).send();
});

app.get("/account", verifyIsExistsAccountCPF, (request, response) => {
  const { customer } = request;
  return response.json(customer);
});

app.delete("/account", verifyIsExistsAccountCPF, (request, response) => {
  const { customer } = request;

  // splice
  customers.splice(customer, 1);

  return response.status(200).json(customers);
});

// app.get("/balance", verifyIsExistsAccountCPF, (request, response) => {
//   const { customer } = request;

//   const balance = getBalance(customer.statement);

//   return response.json(balance);
// });

app.listen(3333);
