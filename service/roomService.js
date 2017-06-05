"use strict";
var allRoomInfo = []// 房间信息统计 
var allRoomID = [];// 保存所有房间的ID
module.exports = {
    provideRoomInfo: function (socket, io) {
        socket.emit('updateAllroomInfo', JSON.stringify(allRoomInfo));//home页开启时 提供所有房间信息
    },
    createRoom: function (socket, io) {
        socket.on('createRoom', function (roomInfo) {
            var tempID = parseInt(Math.random() * 9999).toString(); // 临时roomid 
            while (allRoomID.indexOf(tempID) >= 0) { // 判断是否有重复的roomid
                tempID = parseInt(Math.random() * 9999).toString();
            }
            roomInfo.roomID = tempID; // roomid 赋值
            roomInfo.ownerIP = socket.handshake.address; // 将连接的socket端ip添加到对象中
             roomInfo[tempID]=[];
            roomInfo[tempID].push({
                player: roomInfo.owner,
                playerIP: roomInfo.ownerIP,
            });
            allRoomInfo.push(roomInfo); // push到所有房间信息的数组
            io.sockets.emit('updateAllroomInfo', JSON.stringify(allRoomInfo)); // 发送广播 告知room客户端有新房间创建
            allRoomID.push(roomInfo.roomID);
            socket.join(roomInfo.roomID); // 将owner加入到房间中
            socket.send(JSON.stringify(roomInfo)); // 将该房间返回给客户端
        });
    },
    exitRoom: function (socket,io) {
        socket.on('exitRoom', function () { // 监听 '手动restart事件'
            // socket.leave() // 离开room 事件 记得修改
            console.log('触发exitRoom');

        })
    },
    watchRoom: function (socket) {
        socket.on('disconnect', function () {
            console.log('一个socket断开了连接,地址为: ' + socket.handshake.address);
        })
    },
    allRoomInfo: allRoomInfo,
}
// exports.createRoom = 
// exports.watchRoom = 