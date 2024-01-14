// import { Link } from "react-router-dom";
// import { socket } from "./Body";
// import { useEffect, useState } from "react";
// import { useParams } from "react-router-dom";
// import { useTimer } from "use-timer";

// const Room = () => {
//   const { id } = useParams(); //id is a roomname
//   const [status, setStatus] = useState("not rendered");
//   const [intervalId, setIntervalId] = useState(0);
//   const [questionNumber, setQuestionNumber] = useState(1);
//   const [question, setQuestion] = useState({});

//   const { time, start } = useTimer({
//     initialTime: 3,
//     endTime: 0,
//     timerType: "DECREMENTAL",
//     onTimeOver: () => {
//       setStatus("ready"); //if the status is ready, we can request for question
//       // socket.emit('get-question', questionNumber);
//     },
//   });

//   useState(() => {
//     console.log(27, status)
//     if (status == "ready") {
//       //set time interval to request for every 10 seconds

//       const intervalId = setInterval(() => {
//         if (questionNumber < 6) {
//           console.log("inside the ready state interval");
//           console.log(questionNumber);
//           socket.emit("get-question", questionNumber);
//           setQuestionNumber(questionNumber + 1);
//         } else {
//           setStatus("Quiz is over");
//         }
//         setTemp(0);
//       }, 3000);
//     }

//     return () => clearInterval(intervalId);

//   }, [status]);

//   socket.on("take-question", ({ question }) => {
//     setQuestion(question);
//   });

//   useEffect(() => {
//     socket.emit("join-room", id);

//     return () => {
//       // clearInterval(setId)
//     };
//   }, []);

//   socket.on("room-status", (message) => {
//     if (message == "Waiting for other to join") {
//       setStatus(message);
//     }
//     if (message == "Game begins in") {
//       setStatus(message);
//       start(); //call the timer
//     }
//   });

//   return (
//     <>
//       <h1>Room</h1>
//       {status == "Waiting for other to join" ? (
//         <h1>{status}</h1>
//       ) : status == "Game begins in" ? (
//         <h1>
//           {status}
//           {time}
//         </h1>
//       ) : status == "Quiz is over" ? (
//         <h1>Quiz is over</h1>
//       ) : (
//         <>
//           <h1>{question?.question}</h1>
//           <Link>{question?.option1}</Link>
//           <Link>{question?.option2}</Link>
//           <Link>{question?.option3}</Link>
//           <Link>{question?.option4}</Link>
//         </>
//       )}
//     </>
//   );
// };

// export default Room;

//{/* time != 3 ? <h1>{status}</h1> */}

import { Link } from "react-router-dom";
import { socket } from "./Body";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useTimer } from "use-timer";

const Room = () => {
  const { id } = useParams(); //id is a roomname
  const [status, setStatus] = useState("not rendered");
  const [questionNumber, setQuestionNumber] = useState(1);
  const [question, setQuestion] = useState({});
  const [isOptionSelected, setIsOptionSelected] = useState(false);
  const [result, setResult] = useState({});
  const { time, start } = useTimer({
    initialTime: 3,
    endTime: 0,
    timerType: "DECREMENTAL",
    onTimeOver: () => {
      setStatus("ready");
      console.log("after setting status to ready");
      socket.emit("get-question", questionNumber);
      setQuestionNumber(questionNumber + 1);
    },
  });

  useEffect(() => {
    socket.emit("join-room", id);

  }, [id]);

  useEffect(() => {
    let intervalId;

    if (status === "ready") {
      intervalId = setInterval(() => {
        if (questionNumber < 6) {
          console.log("inside the ready state interval");
          console.log(questionNumber);
          socket.emit("get-question", questionNumber);
          setQuestionNumber(questionNumber + 1);
          setIsOptionSelected(false);
        } else {
          console.log("asking for result");
          socket.emit("get-result");
          setStatus("Quiz is over");
        }
      }, 5000);
    }

    socket.on("results", (data) => {
      setResult(data);
      socket.disconnect();
      console.log('socket disconnected')
    });

    return () => {
      clearInterval(intervalId)
      socket.off("results")
    };
  }, [status, questionNumber]);

  useEffect(() => {
    socket.on("take-question", ({ question }) => {
      setQuestion(question);
    });

    socket.on("room-status", (message) => {
      if (message === "Waiting for other to join") {
        setStatus(message);
      }
      if (message === "Game begins in") {
        setStatus(message);
        start(); // call the timer
      }
    });

    return () => {
      // Cleanup socket event listeners
      socket.off("take-question");
      socket.off("room-status");
    };
  }, [start]);

  const handleOptionClick = (e) => {
    setIsOptionSelected(true);
    let answer = e.target.innerHTML;
    socket.emit("selected-answer", questionNumber - 1, answer);
  };

  return (
    <>
      <h1>Room</h1>
      {status === "Waiting for other to join" ? (
        <h1>{status}</h1>
      ) : status === "Game begins in" ? (
        <h1>
          {status}
          {time}
        </h1>
      ) : status === "Quiz is over" ? (
        <>

          <h1>{result?.result}</h1>
          <p className="result">You Score is : { result?.numberOfAnswerCorrect * 10 }</p>
          <p><a href="/"> Exit room</a></p>
        </>
      ) : (
        <>
          <h1>{question?.question}</h1>
          <Link
            style={isOptionSelected ? { pointerEvents: "none" } : null}
            onClick={handleOptionClick}
          >
            {question?.option1}
          </Link>
          <Link
            style={isOptionSelected ? { pointerEvents: "none" } : null}
            onClick={handleOptionClick}
          >
            {question?.option2}
          </Link>
          <Link
            style={isOptionSelected ? { pointerEvents: "none" } : null}
            onClick={handleOptionClick}
          >
            {question?.option3}
          </Link>
          <Link
            style={isOptionSelected ? { pointerEvents: "none" } : null}
            onClick={handleOptionClick}
          >
            {question?.option4}
          </Link>
        </>
      )}
    </>
  );
};

export default Room;
