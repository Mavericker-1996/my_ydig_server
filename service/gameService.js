"use strict";
module.exports={
    beginGame:function(socket,io,allRoomInfo){
        socket.on('beginGame',(getID)=>{
            var currentRoom = allRoomInfo.find((room)=>{
                return getID in room;
            })
            if(currentRoom && currentRoom.roomStatus === "isReady"){
                if(socket.handshake.address === currentRoom.ownerIP){
                    io.to(getID).emit('rpsBeginGame');//向指定room返回响应
                    currentRoom.roomStatus = 'isGaming';
                    io.sockets.emit('updateAllroomInfo',JSON.stringify(allRoomInfo));
                }else{
                    console.log('非房主发出请求,拒绝之.');
                }
            }
            // if(getCurrentRoomInfo.roomStatus === "isReady"){
            //     if(socket.handshake.address === getCurrentRoomInfo.ownerIP){

            //     }else{
            //         console.log('非房主申请开始游戏,拒绝该请求!!');
            //         return;
            //     }
            // }else if(true){

            // }            
        })
    }
}