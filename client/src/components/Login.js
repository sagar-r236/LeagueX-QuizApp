import { useState } from "react";
import { Link } from "react-router-dom";
import { LOGIN_URL, DOMAIN } from "../constant";
import {useNavigate} from "react-router-dom";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(DOMAIN + LOGIN_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username: username, password: password }),
      });
      const status = await response.json();
      
      if (status.message == 'Login successful') {
        navigate('/');
      }else if(status.message == 'Invalid username or password') {
        alert(status.message)
      }else {
        alert("internal server error")
      }
      
      

    } catch (error) {
      console.error("Error: ", error);
    }
  };

  return (
    <>
      <h1>LeagueX Login</h1>
      <form onSubmit={handleLogin}>
        <label htmlFor="username">Username: </label>
        <input
          type="text"
          name="username"
          value={username}
          id="username"
          onChange={(e) => setUsername(e.target.value)}
        ></input>
        <br />
        <label htmlFor="password">Password: </label>
        <input
          type="password"
          name="password"
          value={password}
          id="password"
          onChange={(e) => setPassword(e.target.value)}
        ></input>
        <br />
        <button type="submit">Login</button>
      </form>
    </>
  );
};
export default Login;
