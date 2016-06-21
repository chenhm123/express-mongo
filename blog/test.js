var server = require('net').createServer();
server.on('connection',function(socket){
    socket.end('handled by parent')
})
server.listen(1337,function(){
    child.send('server',server);
})

process.on('message',function(m,server){
    if(m==='server'){
        server.on('connection',function(socket){
            socket.end('handled by child')
        })
    }
})