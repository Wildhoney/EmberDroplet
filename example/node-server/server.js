var express         = require('express'),
    app             = express(),
    fileSystem      = require('fs'),
    server          = require('http').createServer(app).listen(8888);

// Configuration.
app.configure(function(){
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(app.router);
});

app.all('*', function(request, response, next) {
    response.header('Access-Control-Allow-Origin', '*');
    response.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, X-File-Type, X-File-Name, X-File-Size');
    response.header('Access-Control-Allow-Methods', 'POST');
    next();
});

// Responsible for handling the file upload.
app.post('/upload', function(request, response) {

    var file = request.files.file;

    fileSystem.readFile(file.path, function (error, data) {

        var filePath = __dirname + '/uploaded-files/' + file.name;
        fileSystem.writeFile(filePath, data);
        response.send({ filename: file.name, success: true });
        response.end();

    });

});