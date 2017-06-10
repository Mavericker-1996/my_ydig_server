"use strict";
module.exports = {
    updatePlayer: function (socket, io, allRoomInfo) {
        socket.on('updateNewUser', (newUser) => {
            newUser = JSON.parse(newUser);
            console.log('newUser为');
            console.log(newUser);
            // console.log('playerService 中的 allroominfo为');
            console.log(allRoomInfo);
            var currentRoom = allRoomInfo[newUser.roomIndex] // 根据索引获取到当前房间
            // console.log('newUser.roomIndex的值为:'+ newUser.roomIndex);
            // console.log('然后currentRoom的值为')
            console.log(currentRoom);
            if(currentRoom){
                // if(socket.PLAYER_INFO && socket.PLAYER_INFO.USER_IP){return}//如果当前用户存在 则不执行下面代码
                if(socket.handshake.address){//重新连接后 socket已经没有了player_info 所以只能通过地址判断
                    var judgeIndex =currentRoom[currentRoom.roomID].findIndex(key=>{//判断当前房间是否有重复Ip用户
                        return socket.handshake.address === key.playerIP
                    })
                    if(judgeIndex>=0){
                        socket.PLAYER_INFO={};
                        socket.PLAYER_INFO.USER_NAME = newUser.player;
                        socket.PLAYER_INFO.USER_IP = socket.handshake.address;
                        socket.PLAYER_INFO.USER_ROOM_ID =currentRoom.roomID;
                        socket.join(currentRoom.roomID);
                        console.log('已将用户'+socket.handshake.address+'添加到room: '+ currentRoom.roomID+'中')
                        return;
                    }else if(currentRoom[currentRoom.roomID].length === currentRoom.maxNumbers){
                        console.log('房间人数已满,非法进入');
                        return;
                    }
                }
                              
                if(currentRoom[currentRoom.roomID].length === currentRoom.maxNumbers){
                    console.log('人数已满,不能再添加用户');
                    return;
                }
                console.log('获取索引后 currentRoom的值');
                console.log(currentRoom);
                socket.join(currentRoom.roomID)// 将新加入的user 加入到socket.io的room中
                console.log('已将用户'+socket.handshake.address+'添加到room: '+ currentRoom.roomID+'中')
                currentRoom[currentRoom.roomID].push({
                    player: newUser.player,
                    playerIP: socket.handshake.address,
                    score:0, // 记录初始积分
                    answered:false,//标记答题状态
                    topic:'',//初始化题目
                    prompt:'',//初始化提示
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