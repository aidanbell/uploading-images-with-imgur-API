# Uploading Images using Imgur's API

<img src="https://i.imgur.com/n744BL9.png">

## Objectives

Using Imgur's free API, we can quickly and effectively allow our users the ability to upload images, and save references to our database. This method is more secure since we'll be issuing the requests from our back-end.

### Why can't we save images directly to our database?

Remember that MongoDB and PostgreSQL can only store plain text for us. In order for us to store and save images, we need to first upload them to a file server, and then save references to them in the form of URLs. 

In this case, we will use Imgurs file servers to actually store our images, so lets get started.

## The Plan:

Interacting with Imgur's API is actually very easy. They have a well written set of Documentation, and a lot of useful endpoints. The difficult part in this process is actually getting the file or image from the user to send to Imgur. 

This is how our app will 'flow':

1. The user selects the image to upload using an `<input type="file">` from a form in an ejs template
2. A piece of middleware will take that file, store it temporarily on our server, and give us access to all of its properties via `req.file`
3. We will take that file, and convert it to a format that the Imgur API is expecting so we can send a request to their API
4. The API response will let us know if the upload was successful, and give us a url to where we can access that image
5. Finally we'll remove the file that was temporarily stored on our server, and issue a response.

## Register with Imgur

First things first, we're going to need to register an account with Imgur, so that we can get a `CLIENT_ID` to send with our requests. 

> go here to sign up [https://api.imgur.com/oauth2/addclient](https://api.imgur.com/oauth2/addclient)

<img src="https://i.imgur.com/PbjGJoz.png">

#### Important!
Some things to note here, is that we are selecting `Anonymous usage without user authorization` here as our Authorization Type. This is because we want any user to be able to upload an image from our app, regardless of if we are using Imgur's OAuth strategy (which yes, exists). Because of this. our Authorization Callback URL does not need to be something that we'll ever actually use, however, imgur still expects a valid URL, so we'll add in our `https://localhost:3000/` url. 

Once we're all registered, we can move on to the fun stuff!

## Let's write some Code

This lesson is assuming that this functionality is being added to an existing project, however if you wanted to just get this running, you can use the express generator to scaffold an app for you. 

First of all, there are a couple packages that we need to install:
### `multer`
Multer is a very reliable body parsing middleware, and we'll use it to do just that! We can install it, and require it only on the routes where we'll need to send a file (or in our case an image) to our server. Multer is great for uploading files directly to your webserver, but when using services like Heroku, server storage space is quite limited.  

### `fs`
This short and sweet package gives us better access and control over our file system from our server. This will allow us to not only get the proper data out of our image, but also to remove it from temporary storage on our server. 

### `request`
We've worked with this one before. Anyone remember what it does for us?

## (sparse) Front End Code
We need somewhere in our front-end where users can actually select the image they want to upload. We can handle this with a sparse form element:
```html
<form action="/upload" method="POST" enctype="multipart/form-data">
  <input type="file" name='image'>
  <input type="submit">
</form>
```
Make sure you don't forget the `enctype` attribute! We need this to make sure that our request is following the correct Content-Type.

## Routing
First of all, lets code out the route that we'll be hitting with this upload function. Regardless of where this route is going to be defined, we know two things:
1. It's going to be a POST request
2. It will be run through our `multer` middleware to get the image onto our server
3. It will have to hit a controller method to send the image

Its up to you to decide which router this route should belong in, but regardless, our router will need a couple lines to configure `multer`:

```javascript
const multer = require("multer");
const upload = multer({ dest: 'uploads/'});
```

After requiring the package, we need to let it know where to store the images it receives from the user. We're saying to use a directory called "uploads". When you save and restart your server, you'll see a new directory appear in the root of your project. 

> This new directory can and probably should be added to your `.gitignore`. We don't need to push it. 

We'll also need a route handler for the form that we added, making sure that we're calling on our middleware:

```javascript
router.post('/upload', upload.single('image'), uploadCtrl.upload)
```

The argument `image` that we pass into `upload.single()` must be the same as the name attribute on our input element in the form. 


## Controller
We're going to need somewhere to keep our uploading controller functions. This is up to you, but for the purpose of this lesson, we'll keep all of our image uploading functionality together in an `upload.js` controller file. 

Let's start by pasting this code in, and talking about it:
```javascript
const request = require('request');
const fs = require('fs');

function base64_encode(image) {
  // read binary data
  var bitmap = fs.readFileSync(image);
  // convert binary data to base64 encoded string
  return bitmap.toString('base64');
}
```
This is a little helper function that we are going to need to encode our image as base64. You can see the first line parses our image, and the second line returns a base64 string of that image. This function will not be included in our `module.exports` since, we'll only need to use it within our controller. 

Now lets get to our actual controller function called `upload`. Lets first define it, and then have a look at what `multer` is doing for us. 

```javascript
function upload(req, res) {
  console.log(req.file)
}

// req.file:
{
  fieldname: 'image',
  originalname: 'cat_pic.jpg',
  encoding: '7bit',
  mimetype: 'image/jpeg',
  destination: 'uploads/',
  filename: '2fa2c0c9ae2178881ed5871e272f4456',
  path: 'uploads/2fa2c0c9ae2178881ed5871e272f4456',
  size: 5890
}
```
You can see our image logged out in the terminal! Well not exactly. We have a `file` object now attached to our request! `multer` will generate a random name for the image, and also return to us the path to where we can access it. This is what we want to pass to our `base64_encode` function, so let's go ahead and do that. We'll take what is returned from that function and store it in a variable that we can pass to our `request`. If you're feeling brave, try console logging out that variable (It will be a very long string of jibberish).

```javascript
function upload(req, res) {
  let image = base64_encode(req.file.path);
}
```

Awesome! Now we know that our image is successfully getting selected from the front-end, added to our request object, and getting parsed into base64 to make Imgur happy. Let's start working on our API request. We know that the syntax of `request` looks like this: 
```javascript
request(options, callback(err, response){
  ...
})
```
So let's start on that `options` variable.

```javascript
const options = {
  method: 'POST',
  url: 'https://api.imgur.com/3/image',
  headers: {
    Authorization: `Client-ID ${<Your Client ID here>}`,
  },
  formData: {
    image: image,
    type: 'base64'
  },
}
```
From what we've learned, what would be best practice in storing our Client ID? 

Remember that `image` is what is returned from our base64 parsing. We still have to tell Imgur that we will be sending our image as base64, which is why we have a `type` key. Last but not least, let's add in our request. 

```javascript
function upload(req, res, next) {
  let image = base64_encode(req.files.image.file);

  const options = {
    method: 'POST',
    url: 'https://api.imgur.com/3/image',
    headers: {
      Authorization: `Client-ID ${process.env.CLIENT_ID}`,
    },
    formData: {
      image: image,
      type: 'base64'
    },
  };

  request(options, function(err, response) {
    if (err) return console.log(err);
    let body = JSON.parse(response.body)
    console.log(body)
    // Mongoose query here to save to db
    // body.data.link points to imgur url
    res.render(.....)
  })
}
```

As you can see, we are expecting a response back from this POST request. Of course, this is where we will see either a success or failure from our upload. If we have a look at what is logged out in our `body` variable:

```javascript
{
  data: {
    id: '18O8QbP',
    title: null,
    description: null,
    datetime: 1603829328,
    type: 'image/png',
    animated: false,
    width: 750,
    height: 537,
    size: 752954,
    views: 0,
    bandwidth: 0,
    vote: null,
    favorite: false,
    nsfw: null,
    section: null,
    account_url: null,
    account_id: 0,
    is_ad: false,
    in_most_viral: false,
    has_sound: false,
    tags: [],
    ad_type: 0,
    ad_url: '',
    edited: '0',
    in_gallery: false,
    deletehash: 'NDw9FtLQ4x93kmu',
    name: '',
    link: 'https://i.imgur.com/18O8QbP.png'
  },
  success: true,
  status: 200
}
```
The biggest things we actually want from this response, is (obviously) the `success` and `status` (remember, 200 is good!), and of course, the `link` of where the image is actually hosted. This is what we will save into our database. 

But that should be review! You're on your own from here!



