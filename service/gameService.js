"use strict";
const fs = require('fs');
const path = require('path');
function sendTopic(currentRoom, io) {//发送答案
    try {
        var getLine;
        getLine = fs.readFileSync(path.resolve("./public/topic.txt"), "utf-8");
        getLine = getLine.split("\n");
        getLine = getLine[Math.floor(Math.random() * getLine.length - 1)].split(":");
        currentRoom.topic = getLine[0].trim();//获取题目
        currentRoom.prompt = getLine[1].trim();//获取提示
        // topicMsg.topic = topic;
        // topicMsg.prompt = prompt;
        console.log('sendTopic当前消息')
        console.log(currentRoom);
        io.to(currentRoom.roomID).emit('sendTopic', { topic: currentRoom.topic, prompt: currentRoom.prompt });

    } catch (error) {
        console.log(error);
    }

}
function clearAnswered(currentRoom, io) {
    currentRoom.answerCount = 0;
    currentRoom[currentRoom.roomID].map(user => {
        user.answered = false;
    })
};
module.exports = {
    beginGame: function (socket, io, allRoomInfo) {
        socket.on('beginGame', (getID) => {
            // console.log('触发beginGame allRoomInfo的值是');
            // console.log(allRoomInfo);
            var currentRoom = allRoomInfo.find((room) => {
                return getID in room;
            })
            // getCurrentRoomID = getID;//赋值给全局变量
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
        const gameTimes = 60000; // 设置游戏时间
        // var drawerIndex = 0;//初始化drawer成员的index
        var globalChangeDrawer = null;//??暂时搁置这里
        var roundTime = null;//全局初始化轮数计时器
        try {
            socket.on('gamePlaying', (roomIndex) => {
                // var globalChangeDrawer = null;// 暂时挪到gamePlaying上方

                var rotateTimes = null;//全局初始化轮数
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
                console.log('第76行调用');
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
                                io.to(currentRoom.roomID).emit('getAnswer', currentRoom.topic)//发送答案
                                setTimeout(function () {
                                    try {
                                        currentRoom.drawer = currentRoom[currentRoom.roomID][drawerIndex].player;//当前房间的drawer修改
                                        currentRoom.drawerIP = currentRoom[currentRoom.roomID][drawerIndex].playerIP;//当前房间的drawerIndex修改
                                        clearAnswered(currentRoom, io)// 调用清除记录方法
                                        io.to(currentRoom.roomID).emit('updateAllroomInfo', JSON.stringify(allRoomInfo));//更换drawer的事件,只需要广播当前房间即可
                                        console.log('第94行调用');
                                        sendTopic(currentRoom, io); // 调用发送题目函数
                                    } catch (error) {
                                        console.log(error)
                                    }

                                }, 3000);
                                return;
                            } else {//若已经到了第二轮 则退出房间 
                                console.log('已经到了第二轮,当前rotateTimes的值为: ' + rotateTimes);
                                clearInterval(roundTime);//清除循环
                                io.to(currentRoom.roomID).emit('getAnswer', currentRoom.topic)//发送答案
                                setTimeout(function () {
                                    try {
                                        currentRoom.roomStatus = "isReady";//修改房间状态
                                        clearAnswered(currentRoom, io);
                                        currentRoom[currentRoom.roomID].map(user => {
                                            user.score = 0;
                                        });
                                        io.sockets.emit('updateAllroomInfo', JSON.stringify(allRoomInfo));//也是要让主页收到信息
                                    } catch (error) {
                                        console.log(error)
                                    }

                                }, 3000);
                                return;
                            }
                        } else {
                            console.log('没有到最后一个玩家,当前drawer的Index是' + drawerIndex);
                            io.to(currentRoom.roomID).emit('getAnswer', currentRoom.topic)//发送答案
                            setTimeout(function () {
                                try {
                                    drawerIndex++;//drawer设置为下一个玩家
                                    currentRoom.drawer = currentRoom[currentRoom.roomID][drawerIndex].player;
                                    currentRoom.drawerIP = currentRoom[currentRoom.roomID][drawerIndex].playerIP;
                                    clearAnswered(currentRoom, io);
                                    io.to(currentRoom.roomID).emit('updateAllroomInfo', JSON.stringify(allRoomInfo));//更换drawer的事件,只需要广播当前房间即可
                                    console.log('第110行调用');
                                    sendTopic(currentRoom, io); // 调用发送题目函数
                                } catch (error) {
                                    console.log(error)
                                }
                            }, 3000);
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
                                    clearInterval(roundTime);//清除循环
                                    io.to(currentRoom.roomID).emit('getAnswer', currentRoom.topic)//发送答案
                                    setTimeout(function () {
                                        try {
                                            currentRoom.roomStatus = "isReady";//修改房间状态
                                            clearAnswered(currentRoom, io);
                                            currentRoom[currentRoom.roomID].map(user => {
                                                user.score = 0;
                                            });
                                            io.sockets.emit('updateAllroomInfo', JSON.stringify(allRoomInfo));//也是要让主页收到信息    
                                        } catch (error) {
                                            console.log(error)
                                        }

                                    }, 3000);
                                    return;
                                } else {
                                    rotateTimes++;
                                    console.log('最后一个drawer退出了')
                                    drawerIndex = 0;//归零
                                    io.to(currentRoom.roomID).emit('getAnswer', currentRoom.topic)//发送答案
                                    setTimeout(function () {
                                        try {
                                            console.log('drawer退出 将tempIndex赋值给drawerIndex,此时的drawerIndes值为' + drawerIndex);
                                            console.log('curentRoom信息为');
                                            console.log(currentRoom);
                                            console.log('所以 这回的房间信息为');
                                            console.log(currentRoom[currentRoom.roomID]);
                                            currentRoom.drawer = currentRoom[currentRoom.roomID][drawerIndex].player;
                                            currentRoom.drawerIP = currentRoom[currentRoom.roomID][drawerIndex].playerIP;
                                            clearAnswered(currentRoom, io);
                                            io.to(currentRoom.roomID).emit('updateAllroomInfo', JSON.stringify(allRoomInfo));//更换drawer的事件,只需要广播当前房间即可
                                            console.log('第139行调用');
                                            sendTopic(currentRoom, io); // 调用发送题目函数
                                        } catch (error) {
                                            console.log(error)
                                        }

                                    }, 3000);
                                    // console.log('第130行调用');
                                    // sendTopic(currentRoom, io); // 调用发送题目函数

                                    return;
                                }
                            } else {
                                io.to(currentRoom.roomID).emit('getAnswer', currentRoom.topic)//发送答案
                                setTimeout(function () {
                                    try {
                                        console.log('drawer退出 将tempIndex赋值给drawerIndex,此时的drawerIndes值为' + drawerIndex);
                                        console.log('curentRoom信息为');
                                        console.log(currentRoom);
                                        console.log('所以 这回的房间信息为');
                                        console.log(currentRoom[currentRoom.roomID]);
                                        currentRoom.drawer = currentRoom[currentRoom.roomID][drawerIndex].player;
                                        currentRoom.drawerIP = currentRoom[currentRoom.roomID][drawerIndex].playerIP;
                                        clearAnswered(currentRoom, io);
                                        io.to(currentRoom.roomID).emit('updateAllroomInfo', JSON.stringify(allRoomInfo));//更换drawer的事件,只需要广播当前房间即可
                                        console.log('第139行调用');
                                        sendTopic(currentRoom, io); // 调用发送题目函数
                                    } catch (error) {
                                        console.log(error)
                                    }

                                }, 3000);
                                return;
                            }

                        } catch (error) {// 此处是为了捕获tempindex是否报错
                            console.log(error);
                        }
                    }
                };
                if (currentRoom) {//判断当前房间是否存在
                    try {//预防未知的bug
                        roundTime = setInterval(globalChangeDrawer, gameTimes)
                    } catch (error) {
                        console.log(error);
                    }

                };
            })
            socket.on('onDraw', data => {//开始画图
                try {
                    var currentRoom = allRoomInfo[data.roomIndex];//获取当前房间
                    console.log('当前房间为');
                    console.log(currentRoom);
                    var userIndex = currentRoom[currentRoom.roomID].findIndex(room => {
                        return socket.PLAYER_INFO.USER_IP === room.playerIP;
                    });
                    console.log('ordraw接受后 userIndex 为: ' + userIndex);
                    if (userIndex >= 0) {
                        console.log('触发了onDraw给客户端')
                        socket.to(currentRoom.roomID).emit('onDraw', data.url);//向当前房间传递绘制的图
                    };
                } catch (error) {
                    console.log(error);
                    return;
                };
            });
            socket.on('sendAnswer', msg => {// 接受消息
                try {
                    console.log('触发sendAnswer');
                    var currentRoom = allRoomInfo[msg.roomIndex];//获取当前房间
                    if (msg.answer === currentRoom.topic) { // 如果玩家回答的问题正确
                        if (socket.PLAYER_INFO.USER_IP === currentRoom.drawerIP) { return; }//画你的画,别捣乱
                        var findUser = currentRoom[currentRoom.roomID].find(user => {//寻找对应答题用户
                            return socket.PLAYER_INFO.USER_IP === user.playerIP;
                        })
                        var findDrawer = currentRoom[currentRoom.roomID].find(user => {
                            return currentRoom.drawerIP === user.playerIP;
                        })
                        if (findUser.answered === false) {// 判断用户是不是已经答过题了
                            if (currentRoom.answerCount === 0) {//判断是不是第一个答对题的人
                                findUser.score += 2;//加2分
                            } else {
                                findUser.score++;//加1分
                            }
                            findDrawer.score++;//drawer加分
                            findUser.answered = true;// 标记答题记录
                            currentRoom.answerCount++;// 标记当前房间答对题的人数
                        }
                        io.to(currentRoom.roomID).emit('updateAllroomInfo', JSON.stringify(allRoomInfo));//广播当前房间 更新用户
                        // if (currentRoom.answerCount === currentRoom[currentRoom.roomID].length - 1) {//判断答题人数是不是满了
                        //     console.log('答题人满')
                        //     console.log(roundTime);
                        //     console.log(globalChangeDrawer);
                        //     clearInterval(roundTime);
                        //     globalChangeDrawer();
                        //     roundTime();
                        // }
                    } else {
                        socket.to(socket.PLAYER_INFO.USER_ROOM_ID).emit('rpsSendAnswer', msg.answer);
                    }
                } catch (error) {
                    console.log(error)
                }
            });
        } catch (error) {
            console.log(error);
        }
    },
}