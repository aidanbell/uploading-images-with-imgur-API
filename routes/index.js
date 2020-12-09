var express = require('express');
var router = express.Router();

const uploadCtrl = require('../controllers/upload');
const upload = require('../controllers/upload');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.post('/upload', uploadCtrl.upload)

module.exports = router;
