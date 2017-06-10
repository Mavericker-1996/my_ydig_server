"use strict";
const fs = require('fs');
const path = require('path');
var getCurrentRoomID = null;//初始化当前房间
var roundTime = null;//全局初始化轮数计时器
var rotateTimes = null;//全局初始化轮数
var globalChangeDrawer = null;
var getLine;
// getLine = getLine[Math.floor(Math.random() * getLine.length - 1)].split(":");
var topic = null;//初始化题目
var prompt = null;//初始化 提示
var topicMsg = {};
function sendTopic(currentRoom, io) {
    try {
        getLine = fs.readFileSync(path.resolve("./public/topic.txt"), "utf-8");
        getLine = getLine.split("\n");
        getLine = getLine[Math.floor(Math.random() * getLine.length - 1)].split(":");
        topic = getLine[0].trim();//获取题目
        prompt = getLine[1].trim();//获取提示
        topicMsg.topic = topic;
        topicMsg.prompt = prompt;
        console.log('sendTopic当前消息')
        console.log(currentRoom);
        io.to(currentRoom.roomID).emit('sendTopic', topicMsg);

    } catch (error) {
        console.log(error);
    }

}
module.exports = {
    beginGame: function (socket, io, allRoomInfo) {
        socket.on('beginGame', (getID) => {
            // console.log('触发beginGame allRoomInfo的值是');
            // console.log(allRoomInfo);
            var currentRoom = allRoomInfo.find((room) => {
                return getID in room;
            })
            getCurrentRoomID = getID;//赋值给全局变量
            if (currentRoom && currentRoom.roomStatus === "isReady") {
                if (socket.handshake.address === currentRoom.ownerIP) {
                    // io.to(getID).emit('rpsBeginGame');//向指定room返回响应
                    // io.sockets.emit('updateAllroomInfo', JSON.stringify(allRoomInfo));// 目的是让主页收到信息 更新游戏状态
                    console.log('发出rpsBeginGame响应前,allroomInfo为');
                    console.log(allRoomInfo);
                    socket.emit('rpsBeginGame')// 向房主发出响应
                    io.to(getID).emit('toEnterGame');//向指定room返回响应
                    currentRoom.drawer = socket.PLAYER_INFO.USER_NAME;//初始化drawer
                    currentRoom.drawerIP = socket.PLAYER_INFO.USER_IP;
                    currentRoom.answerCount = 0;// 记录回答正确的人数
                    currentRoom.roomStatus = 'isGaming';
                    io.sockets.emit('updateAllroomInfo', JSON.stringify(allRoomInfo));// 目的是让主页收到信息 更新游戏状态
                } else {
                    console.log('非房主发出请求,拒绝之.');

                }
            }
        })
    },
    gamePlaying: function (socket, io, allRoomInfo) {
        var gameTimes = 5000; // 设置游戏时间
        // var drawerIndex = 0;//初始化drawer成员的index
        try {
            socket.on('gamePlaying', (roomIndex) => {
                console.log('触发gamePlaying,来自: ' + socket.PLAYER_INFO.USER_NAME);
                rotateTimes = 1;// 初始化当前是第一轮
                console.log('gameplaying触发后此时allroominfo的值');
                console.log(allRoomInfo);
                console.log("roomIndex 是")
                console.log(roomIndex);
                var currentRoom = allRoomInfo[roomIndex];//获取当前房间
                var tempIndex = 0;//初始化临时用户索引
                console.log('gameplaying执行后,currentroom的值为:');
                console.log(currentRoom);
                sendTopic(currentRoom, io);//首次执行 发送题目和提示
                globalChangeDrawer = function () {//每回合结束时 执行判断
                    var drawerIndex = currentRoom[currentRoom.roomID].findIndex(user => {
                        return currentRoom.drawerIP === user.playerIP;
                    })
                    console.log('回合判断后,当前drawerIndex的值是: ' + drawerIndex);
                    if (drawerIndex >= 0) {//判断玩家是否存在
                        tempIndex = drawerIndex;//将当前drawer的index赋值给一个临时index
                        if (drawerIndex === currentRoom[currentRoom.roomID].length - 1) {//判断当前回合是不是已经到最后一个玩家画图了
                            console.log('当前drawer的Index是' + drawerIndex);
                            if (rotateTimes === 1) {//判断是不是第一轮
                                rotateTimes = rotateTimes + 1;//进入第二轮
                                console.log('进入了第二轮');
                                drawerIndex = 0;//drawer设置为第一个玩家
                                currentRoom.drawer = currentRoom[currentRoom.roomID][drawerIndex].player;//当前房间的drawer修改
                                currentRoom.drawerIP = currentRoom[currentRoom.roomID][drawerIndex].playerIP;//当前房间的drawerIndex修改
                                io.to(currentRoom.roomID).emit('updateAllroomInfo', JSON.stringify(allRoomInfo));//更换drawer的事件,只需要广播当前房间即可
                                sendTopic(currentRoom, io); // 调用发送题目函数
                                return;
                            } else {//若已经到了第二轮 则退出房间 
                                console.log('已经到了第二轮,当前rotateTimes的值为: ' + rotateTimes);
                                currentRoom.roomStatus = "isReady";//修改房间状态
                                io.sockets.emit('updateAllroomInfo', JSON.stringify(allRoomInfo));//也是要让主页收到信息
                                clearInterval(roundTime);//清除循环
                                return;
                            }
                        } else {
                            console.log('没有到最后一个玩家,当前drawer的Index是' + drawerIndex);
                            drawerIndex++;//drawer设置为下一个玩家
                            currentRoom.drawer = currentRoom[currentRoom.roomID][drawerIndex].player;
                            currentRoom.drawerIP = currentRoom[currentRoom.roomID][drawerIndex].playerIP;
                            io.to(currentRoom.roomID).emit('updateAllroomInfo', JSON.stringify(allRoomInfo));//更换drawer的事件,只需要广播当前房间即可
                            sendTopic(currentRoom, io); // 调用发送题目函数
                            return;
                        }
                    } else {//如果当前玩家退出了
                        try {
                            console.log('??? drawerIndex');
                            console.log(drawerIndex);
                            drawerIndex = tempIndex;//将当前临时index重新赋值给drawerIndex
                            if (drawerIndex >= currentRoom[currentRoom.roomID].length) {//如果超出人数范围
                                if (rotateTimes === 2) {
                                    console.log('最后一个玩家退出了 而且当前已经到了第二轮')
                                    currentRoom.roomStatus = "isReady";//修改房间状态
                                    io.sockets.emit('updateAllroomInfo', JSON.stringify(allRoomInfo));//也是要让主页收到信息
                                    clearInterval(roundTime);//清除循环
                                    return;
                                } else {
                                    rotateTimes++;
                                    console.log('最后一个drawer退出了')
                                    drawerIndex = 0;//归零
                                    sendTopic(currentRoom, io); // 调用发送题目函数
                                    // return;暂时注释掉
                                }
                            }
                            console.log('drawer退出 将tempIndex赋值给drawerIndex,此时的drawerIndes值为' + drawerIndex);
                            console.log('所以 这回的房间信息为');
                            console.log(currentRoom[currentRoom.roomID]);
                            currentRoom.drawer = currentRoom[currentRoom.roomID][drawerIndex].player;
                            currentRoom.drawerIP = currentRoom[currentRoom.roomID][drawerIndex].playerIP;
                            io.to(currentRoom.roomID).emit('updateAllroomInfo', JSON.stringify(allRoomInfo));//更换drawer的事件,只需要广播当前房间即可
                            sendTopic(currentRoom, io); // 调用发送题目函数
                            return;
                        } catch (error) {// 此处是为了捕获tempindex是否报错
                            console.log(error);
                        }
                    }
                }
                if (currentRoom) {//判断当前房间是否存在
                    try {//预防未知的bug
                        roundTime = setInterval(globalChangeDrawer, gameTimes)
                    } catch (error) {
                        console.log(error);
                    }

                }
            })

        } catch (error) {
            console.log(error);
        }
    },
    gameDrawing: function (socket, io, allRoomInfo) {
        socket.on('onDraw', data => {//开始画图
            var currentRoom = allRoomInfo.find((room) => {
                return getCurrentRoomID in room;
            });
            try {
                var userIndex = currentRoom[currentRoom.roomID].findIndex(room => {
                    return socket.PLAYER_INFO.USER_IP === room.playerIP;
                });
                if (userIndex >= 0) {
                    socket.to(currentRoom.roomID).emit('onDraw', data);//向当前房间传递绘制的图
                };
            } catch (error) {
                console.log(error);
                return;
            };
        });
        socket.on('sendAnswer', msg => {// 接受消息
            console.log('触发sendAnswer');
            socket.to(socket.PLAYER_INFO.USER_ROOM_ID).emit('rpsSendAnswer', msg);
        })
    }
}