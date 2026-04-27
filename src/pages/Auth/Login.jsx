import {useState} from 'react'
import '/Login.css'

function Login(){
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log('Login submitted:',{username,password})
        // To DO: connct to backend for authentication
    }
    return(
        <div className="login-wrapper">
            <div className="login-left">
                <div className="brand">
                    
                </div>
            </div>
        </div>
    )
}