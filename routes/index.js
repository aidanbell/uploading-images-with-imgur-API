var express = require('express');
var router = express.Router();
const multer = require("multer");
const upload = multer({ dest: 'uploads/'});

const uploadCtrl = require('../controllers/upload');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.post('/upload', upload.single('image'), uploadCtrl.upload)


module.exports = router;
