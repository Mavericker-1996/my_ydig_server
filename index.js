const path = require('path');
const express = require('express');
const app = express();
const http = require('http').createServer(app);
const socket_io = require('socket.io');
var io = socket_io(http);
const roomService = require("./service/roomService");
const playerService = require('./service/playerService');
const gameService = require('./service/gameService');
app.use(express.static(path.join(__dirname + '/public'))); // 静态文件目录
io.on('connection', function (socket) {
    console.log('一个socket连接了...')
    roomService.provideRoomInfo(socket, io);
    roomService.createRoom(socket, io);
    roomService.exitRoom(socket, io);
    roomService.watchRoom(socket,io);
    playerService.updatePlayer(socket, io, roomService.allRoomInfo);
    gameService.beginGame(socket,io,roomService.allRoomInfo);
    gameService.gamePlaying(socket,io,roomService.allRoomInfo);
})
http.listen(9999, error => {
    if (error) {
        console.log('连接错误:');
        console.log(error);
    } else {
    }
})