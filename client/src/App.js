import React from "react";
import ReactDOM  from "react-dom/client";
import Body from "./components/Body";
import Room from "./components/Room";
import Login from "./components/Login";
import Signup from "./components/Signup";
import HeaderComponent from "./components/HeaderComponent";
import { createBrowserRouter, Route, RouterProvider, Outlet } from "react-router-dom";
import Test from "./components/Test";

const root = ReactDOM.createRoot(document.getElementById('root'))

const AppComponent  = () => { 
    return (
        <>
            <HeaderComponent />
            <Outlet />
        </>
        
    )
}

const appRouter = createBrowserRouter([
        {
            path: "/",
            element: <AppComponent />,
            children : [
                {
                    path: '/', 
                    element: <Body />
                },
                {
                    path: 'room/:id',
                    element: <Room />
                },
                {
                    path: 'login',
                    element: <Login />
                }, 
                {
                    path: 'signup',
                    element: <Signup />
                },
                {
                    path: 'test',
                    element: <Test />
                }
            ]
        }
    ]
)

root.render(<RouterProvider router={appRouter}  />)