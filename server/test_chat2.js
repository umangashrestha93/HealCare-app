const axios = require('axios');
async function run() {
  try {
    const res = await axios.get('http://127.0.0.1:5000/api/practitioners');
    const pract = res.data.data[0];
    const receiverId = pract.userId._id;
    // Log in to get fresh token
    const loginRes = await axios.post('http://127.0.0.1:5000/api/auth/login', {email:"client@test.com", password:"Password123"});
    const token = loginRes.data.access_token;
    
    // Test chat POST with proper trailing slash or correct base URL
    const sendRes = await axios.post('http://127.0.0.1:5000/api/chat/', 
      { receiverId, content: "Test message via script 2" }, 
      { headers: { Authorization: 'Bearer ' + token } }
    );
    console.log("Send success:", sendRes.data);
  } catch (err) {
    console.error("Error Status:", err.response?.status);
    console.error("Error Data:", err.response?.data || err.message);
  }
}
run();
