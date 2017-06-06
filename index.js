const path = require('path');
const fs = require('fs')
const express = require('express');
const socket_io = require('socket.io');
const app = express();
const http = require('http').createServer(app);
var io = socket_io(http);
const roomService = require("./service/roomService");
const playerService = require('./service/playerService');
app.use(express.static(path.join(__dirname + '/public'))); // 静态文件目录
io.on('connection', function (socket) {
    console.log('一个socket连接了...')
    roomService.provideRoomInfo(socket, io);
    roomService.createRoom(socket, io);
    roomService.exitRoom(socket, io);
    roomService.watchRoom(socket,io);
    playerService.updatePlayer(socket, io, roomService.allRoomInfo);
})
http.listen(9999, error => {
    if (error) {
        console.log('连接错误:');
        console.log(error);
    } else {
    }
})