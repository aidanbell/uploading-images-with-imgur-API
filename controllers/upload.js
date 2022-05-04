const request = require('request');

// file-system package to help us getting the base64 encoded image
const fs = require('fs');

function base64_encode(file) {
  // read binary data
  var bitmap = fs.readFileSync(file);
  // convert binary data to base64 encoded string
  return bitmap.toString('base64');
}

function upload(req, res, next) {
  console.log(req.file)
  let image = base64_encode(req.file.path);

  const options = {
    method: "POST",
    url: "https://api.imgur.com/3/image",
    headers: {
      Authorization: `Client-ID ${process.env.IMGUR_CLIENT_ID}`,
    },
    formData: {
      image: image,
      type: "base64",
    },
  };

  request(options, function(err, response) {
    if (err) return console.log(err);
    let body = JSON.parse(response.body)
    console.log(body)
    // Mongoose query here to save to db
    // body.data.link points to imgur url
    fs.unlink(req.file.path, function(err) {
      if (err) return console.log(err)
      let link = body.data
      res.render('new', { link })
    })
  })
}

module.exports = {
  upload
}