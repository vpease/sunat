var express = require('express');
var router = express.Router();
var control;

function setControl(pControl) {
  console.log('El control se ha fijado');
  control = pControl;
  return true;
}
/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.post("/", function (req, res, next) {  
  console.log('Recibido el post : ' + JSON.stringify(req.query));  
  const consulta = req.query.request;  
  control.consultar(consulta)
    .then(resp => {
      res.send(resp);
    })
    .catch(error => {
      res.send('Error');
      console.log('Error en el post: ' + error);
  })
});

module.exports = {
  ServiceRouter: router,
  setControl: setControl
};
