import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { io } from "socket.io-client";

export const socket = io("http://localhost:3000", {
  withCredentials: true,
});

const Body = () => {
  const [lobbyData, setLobbyData] = useState([]);
  const [isInRoom, setIsInRoom] = useState(false);


  function joinRoom(e) {
    
    console.log(e.currentTarget.room)
  }

  useEffect(() => {
    
    socket.emit("requestLobbyData");

    socket.on("lobbyData", (data) => {
      setLobbyData(data.rooms);
    });

    // Handle any errors from the server
    socket.on("lobbyDataError", (error) => {
      console.error("Error fetching lobby data:", error);
    });

    socket.emit('isin-room');

    socket.on('isin-room-server', data => {
      console.log('entered isin-room');
      setIsInRoom(data);
      console.log(data);
    })

    return () => {
      socket.off("lobbyData");
      socket.off("lobbyDataError");
    }

  }, []);

  socket.on('broadcast-lobby-data-after-update', (data) => {
    setLobbyData(data.rooms)
  })

  return isInRoom ? <><h1>Lobby Data</h1><p>You are alreay present in the room <a href="/"> Exit room</a></p></> :
    (
    <div>
      <h1>Lobby Data</h1>
      <ul>
        {lobbyData.map((room) => (
        
          <>
          {
        
            room.slots_available < 1 ? 
              (
                <li key={room.room_name}>{room.room_name} - Slots: no slots</li>
              ) : 
              (
                <>
                  <li key={room.room_name}>{room.room_name} - Slots: {room.slots_available}</li>
                  <Link to={`room/${room.room_name}`} onClick={joinRoom} >Join</Link>
                </> 
              )

          }
          
          </>
        ))}
      </ul>
    </div>
  );
};

export default Body;
