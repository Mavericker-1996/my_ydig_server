"use strict";
module.exports = {
    updatePlayer: function (socket, io, allRoomInfo) {
        socket.on('updateNewUser', (newUser) => {
            newUser = JSON.parse(newUser);
            console.log('newUser为');
            console.log(newUser);
            console.log('playerService 中的 allroominfo为');
            console.log(allRoomInfo);
            var currentRoom = allRoomInfo[newUser.roomIndex] // 根据索引获取到当前房间
            if(currentRoom){
                if(currentRoom[currentRoom.roomID].length === currentRoom.maxNumbers){
                console.log('人数已满');
                return;
                }
                console.log('获取索引后 currentRoom的值');
                console.log(currentRoom);
                socket.join(currentRoom.roomID)// 将新加入的user 加入到socket.io的room中
                currentRoom[currentRoom.roomID].push({
                    player: newUser.player,
                    playerIP: socket.handshake.address,
                })
                socket.PLAYER_INFO={}; // 将用户信息保存到对应的socket中
                socket.PLAYER_INFO.USER_NAME = newUser.player;
                socket.PLAYER_INFO.USER_IP = socket.handshake.address;
                socket.PLAYER_INFO.USER_ROOM_ID = currentRoom.roomID;
                io.sockets.emit('updateAllroomInfo',JSON.stringify(allRoomInfo));
            }
            
        })
    },
}