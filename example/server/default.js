var express = require('express'),
    app     = express(),
    multer  = require('multer'),
    fs      = require('fs'),
    server  = require('http').createServer(app),
    upload  = multer({ dest: __dirname + '/uploaded-files' });

app.use(express.static(__dirname + '/..'));
server.listen(process.env.PORT || 5000);

app.post('/upload', upload.array('file'), function(request, response, next) {
    response.send({ files: request.files, success: true });
});