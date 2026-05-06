import { BrowserRouter as Router, Route, Navigate, Routes }  from "react-router-dom";
import Login  from "./pages/Auth/Login";
import Register from "./pages/Auth/Register";
function App(){
  return(
   <Router>
    <Routes>
      <Route path="/" element={<Navigate to="/login" />} />
      <Route path="/login" element={<Login/>} />
      <Route path="/register" element={<Register/>} />
    </Routes>
   </Router>
  )
}

export default App;