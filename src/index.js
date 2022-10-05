const express = require('express');

const { v4: idGenerate } = require('uuid');

const app = express();

const port = process.env.PORT || 3000;

app.use(express.json());

const customers = [];

/**
 * cpf - string
 * name - string
 * id - uuid
 * statement [] (lançamentos)
 */
app.post('/account', function(req, res) {
    
    const { name, cpf } = req.body;

    const customerAlredyExists = customers.some(customer => customer.cpf === cpf);

    if (!customerAlredyExists) {

        customers.push({
            id: idGenerate(),
            cpf,
            name,
            statement: []
        });
         
        return res.status(201).json({ success: true, message: 'Operação realizada com sucesso!'});
    
    } else {

        return res.status(400).json({ success: false, message: 'Operação não realizada, esse cpf já está sendo utilizado!'});

    }

});


function verifyIfExistsAccountCPF(req, res, next) {

    const { cpf } = req.headers;

    console.log(cpf)

    const customer = customers.find(customer => customer.cpf === cpf);

    if (!customer) {

        return res.status(200).json({
            success: false,
            message: 'Falha ao realizar operação: Usuário não existe',
        });
    
    } 

    req.customer = customer;

    next()

}

app.use(verifyIfExistsAccountCPF);

app.get('/statment', function(req, res) {

    const { customer } = req;

    return res.status(200).json({
        success: true,
        message: 'Operação realizada com sucesso',
        customer
    });

});


app.post('/deposit', function(req, res) {

    const { description, amount } = req.body;
    const { customer } = req;

    const statementOperation = {
        description,
        amount,
        created_at: new Date(),
        type: 'credit'
    }

    customer.statement.push(statementOperation);

    return res.status(201).json({
        success: true,
        message: 'Operação realizada com sucesso',
        data: customer
    });    

});


function getBalance(statement) {

    const balance = statement.reduce(function(acc, operation) {

        if (operation.type === 'credit') {
       
            return acc + operation.amount;
       
        } else {

            return acc - operation.amount;
        }

        
    }, 0);

    return balance;

}

app.post('/withdraw', function(req, res) {

    const { amount } = req.body;

    const { customer } = req;

    const balance = getBalance(customer.statement);

    if (balance < amount) {

        return res.status(400).json({ success: false, message: 'Saldo insuficiente '});

    } 

    const statementOperation = {
        amount,
        created_at: new Date(),
        type: 'debit'
    }

    customer.statement.push(statementOperation);

    return res.status(201).json({
        success: true,
        message: 'Operação realizada com sucesso',
        data: customer
    });    

});

app.get('/statment/date', verifyIfExistsAccountCPF, function(req, res) {

    const { customer } = req;

    const { date } = req.query;

    const dateFormat = new Date(date + ' 00:00');

    const statement = customer.statement.filter(
        (statement) => statement.created_at.toDateString() == new Date(dateFormat).toDateString());
    
    return res.status(200).json(customer.statement);

});


app.put('/customer', function(req, res) {

    const { name } = req.body;

    const { customer } = req;

    customer.name = name;

    console.log(customer)

    return res.status(201).json({
        message: 'Operação Realizada com sucesso!',
        customer
    });

});


app.delete('/account', function(req, res) {

    const { customer } = req;

    customers.splice(customer, 1);

    return res.status(200).json({
        message: 'Operação Realizada com sucesso!',
        customers
    });

});

app.get('/balance', verifyIfExistsAccountCPF, function(req, res) {
    
    const { customer } = req;

    const balance = getBalance(customer.statement);

    return res.json(balance);
    
});


















app.listen(port);