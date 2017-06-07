"use strict";
module.exports = {
    beginGame: function (socket, io, allRoomInfo) {
        socket.on('beginGame', (getID) => {
            var currentRoom = allRoomInfo.find((room) => {
                return getID in room;
            })
            if (currentRoom && currentRoom.roomStatus === "isReady") {
                if (socket.handshake.address === currentRoom.ownerIP) {
                    io.to(getID).emit('rpsBeginGame');//向指定room返回响应
                    currentRoom.drawer = socket.PLAYER_INFO.USER_NAME;
                    currentRoom.drawerIP = socket.PLAYER_INFO.USER_IP;
                    currentRoom.roomStatus = 'isGaming';
                    io.sockets.emit('updateAllroomInfo', JSON.stringify(allRoomInfo));
                } else {
                    console.log('非房主发出请求,拒绝之.');
                }
            }
        })
    },
    gamePlaying: function (socket, io, allRoomInfo) {
        var gameTimes = 5000; // 设置游戏时间
        try {
            socket.on('gamePlaying', (roomIndex) => {// 游戏开始时 触发游戏计时
                var timeGame = setTimeout(function () {
                    if(allRoomInfo[roomIndex]){
                        var currentRoom = allRoomInfo[roomIndex];
                        currentRoom.roomStatus ="isReady";
                         io.to(currentRoom.roomID).emit('updateAllroomInfo', JSON.stringify(allRoomInfo));
                    }
                }, gameTimes);
            })
            
        } catch (error) {
            console.log(error)
        }
        

    },
}