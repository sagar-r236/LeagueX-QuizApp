import { Link } from "react-router-dom"
import { useState } from "react"

const Test =  () => {

    const [buttonClicked, setButtonClicked] = useState(false)

    const handleClick = (e) => {
        console.log('hello')
        console.log(e.target.innerHTML);
    }

    return <Link onClick={handleClick}>Test</Link>
}

export default Test;