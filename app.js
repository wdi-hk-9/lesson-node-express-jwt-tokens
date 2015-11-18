var express = require('express'),
bodyParser  = require('body-parser'),
mongoose    = require('mongoose'),
app         = express(),
logger      = require('morgan'),
expressJWT  = require('express-jwt'),
jwt         = require('jsonwebtoken'),
Agent       = require('./models/agent');

var secret = "OnHerMajestysSecretService";

mongoose.connect('mongodb://localhost:27017/MI6');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));

if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

app.use('/api/agents/:id', expressJWT({secret: secret}));
app.use(function (error, request, response, next) {
  if (error.name === 'UnauthorizedError') {
    response.status(401).json({message: "Token not found"});
  }
});

//curl -X POST -i -H "Content-Type: application/json" -d '{
//  "name": "James Bond",
//  "codename": "007"
//}' http://localhost:3000/api/authorizations
app.post('/api/authorizations', function(request, response){
  var agentParams = request.body;

  // some code to check that a user's credentials are right #bcryptmaybe?
  Agent.findOne({codename: agentParams.codename}, function (err, agent){
    if (!agent) return response.status(404).json({message: "There is no agent by that codename."});

    agent.authenticate(agentParams.name, function(err, isMatch){
      if (isMatch){
        // collect any information we want to include in the token, like that user's info
        // make a token already & send it as JSON

        // create a token
        var token = jwt.sign(agent, secret);
        // send a token
        return response.json({ agent: agent, token: token });
      } else {
        return response.status(401).json({message: "You don't have clearance, agent."});
      }
    });
  });
});

var routes = require('./config/routes');
app.use('/api', routes);

app.listen(3000);