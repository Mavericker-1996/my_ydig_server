"use strict";
var allRoomInfo = []// 房间信息统计 
var allRoomID = [];// 保存所有房间的ID
module.exports = {
    provideRoomInfo: function (socket, io) {
        socket.emit('updateAllroomInfo', JSON.stringify(allRoomInfo));//index.html页开启时 提供所有房间信息
        socket.on('updateAllroomInfo', () => {
            console.log('触发了updateAllroomInfo请求 此时的allRoomInfo数据为');
            console.log(allRoomInfo);
            socket.emit('updateAllroomInfo', JSON.stringify(allRoomInfo));
        })
    },
    createRoom: function (socket, io) {
        socket.on('createRoom', function (roomInfo) {
            var tempID = parseInt(Math.random() * 9999).toString(); // 临时roomid 
            while (allRoomID.indexOf(tempID) >= 0) { // 判断是否有重复的roomid
                tempID = parseInt(Math.random() * 9999).toString();
            }
            roomInfo.roomID = tempID; // roomid 赋值
            roomInfo.ownerIP = socket.handshake.address; // 将连接的socket端ip添加到对象中
            roomInfo.maxNumbers = 3;
            roomInfo[tempID] = [];
            // roomInfo[tempID].push({
            //     player: roomInfo.owner,
            //     playerIP: roomInfo.ownerIP,
            // });
            allRoomInfo.push(roomInfo); // push到所有房间信息的数组
            io.sockets.emit('updateAllroomInfo', JSON.stringify(allRoomInfo)); // 发送广播 告知room客户端有新房间创建
            allRoomID.push(roomInfo.roomID);
            socket.join(roomInfo.roomID); // 将owner加入到房间中
            socket.send(JSON.stringify(roomInfo)); // 将该房间返回给客户端
        });
    },
    exitRoom: function (socket, io) {
        try { // 捕获异常部分
            socket.on('exitRoom', function () { // 监听 '手动restart事件'
                console.log('触发exitRoom事件');
                if (socket.PLAYER_INFO) { // 判断用户是否存在
                    console.log('socket用户信息为:');
                    console.log(socket.PLAYER_INFO);
                    socket.leave(socket.PLAYER_INFO.USER_ROOM_ID); // 从socket.io的room中移除  
                    var currentRoomIndex = null; // 获取当前房间索引
                    var currentRoom = allRoomInfo.find((room, index) => { // 获取当前房间对象
                        if (socket.PLAYER_INFO.USER_ROOM_ID in room) {
                            currentRoomIndex = index; // 将当前索引赋值
                            return socket.PLAYER_INFO.USER_ROOM_ID in room;
                        }
                    });
                    console.log('此时的allroominfo的值为:');
                    console.log(allRoomInfo);
                    console.log('获取当前房间对象之后 currentRoom的值为:');
                    console.log(currentRoom);

                    if (allRoomInfo.length === 0) {///出现未知bug  房间为空后又触发该事件
                        return;
                    }
                    var userIndex = currentRoom[socket.PLAYER_INFO.USER_ROOM_ID].findIndex(userInfo => {//从当前房间对象中的id key值数组获取index
                        return userInfo.playerIP === socket.PLAYER_INFO.USER_IP;
                    });
                    console.log('userIndex 的值为:');
                    console.log(userIndex);
                    if (userIndex < 0) { return; }// 如果用户索引不存在 直接return!!
                    console.log('roomid 为:' + socket.PLAYER_INFO.USER_ROOM_ID);
                    currentRoom[socket.PLAYER_INFO.USER_ROOM_ID].splice(userIndex, 1);
                    if (currentRoom[socket.PLAYER_INFO.USER_ROOM_ID].length === 0) { // 判断房间是否已经没有人了
                        allRoomInfo.splice(currentRoomIndex, 1); // 移除该房间
                    } else {
                        currentRoom.owner = currentRoom[socket.PLAYER_INFO.USER_ROOM_ID][0].player;
                        currentRoom.ownerIP = currentRoom[socket.PLAYER_INFO.USER_ROOM_ID][0].playerIP;
                    }
                    io.sockets.emit('updateAllroomInfo', JSON.stringify(allRoomInfo)); //广播所有socket allRoomInfo更新了                                        
                }
            })
        } catch (err) {
            console.log(err);
            return;
        }
    },
    watchRoom: function (socket, io) {
        socket.on('disconnect', function () {
            console.log('一个socket断开了连接,地址为: ' + socket.handshake.address);
            if (socket.PLAYER_INFO) { // 判断用户是否存在   此处加强判断 当用户强制退出时 踢出房间
                console.log('socket用户信息为:');
                console.log(socket.PLAYER_INFO);
                socket.leave(socket.PLAYER_INFO.USER_ROOM_ID); // 从socket.io的room中移除  
                var currentRoomIndex = null; // 获取当前房间索引
                var currentRoom = allRoomInfo.find((room, index) => { // 获取当前房间对象
                    if (socket.PLAYER_INFO.USER_ROOM_ID in room) {
                        currentRoomIndex = index; // 将当前索引赋值
                        return socket.PLAYER_INFO.USER_ROOM_ID in room;
                    }
                });
                console.log('此时的allroominfo的值为:');
                console.log(allRoomInfo);
                console.log('获取当前房间对象之后 currentRoom的值为:');
                console.log(currentRoom);
                // try { // 捕获异常部分
                if (allRoomInfo.length === 0) {///出现未知bug  房间为空后又触发该事件
                    return;
                }
                var userIndex = currentRoom[socket.PLAYER_INFO.USER_ROOM_ID].findIndex(userInfo => {//从当前房间对象中的id key值数组获取index
                    return userInfo.playerIP === socket.PLAYER_INFO.USER_IP;
                });
                console.log('userIndex 的值为:');
                console.log(userIndex);
                if (userIndex < 0) { return; }// 如果用户索引不存在 直接return!!
                console.log('roomid 为:' + socket.PLAYER_INFO.USER_ROOM_ID);
                currentRoom[socket.PLAYER_INFO.USER_ROOM_ID].splice(userIndex, 1);
                if (currentRoom[socket.PLAYER_INFO.USER_ROOM_ID].length === 0) { // 判断房间是否已经没有人了
                    allRoomInfo.splice(currentRoomIndex, 1); // 移除该房间
                } else {
                    currentRoom.owner = currentRoom[socket.PLAYER_INFO.USER_ROOM_ID][0].player;
                    currentRoom.ownerIP = currentRoom[socket.PLAYER_INFO.USER_ROOM_ID][0].playerIP;
                }
                io.sockets.emit('updateAllroomInfo', JSON.stringify(allRoomInfo)); //广播所有socket allRoomInfo更新了
                // }catch(err){
                // console.log(err);
                // return;
                // }                

            }
        })
    },
    allRoomInfo: allRoomInfo,
}