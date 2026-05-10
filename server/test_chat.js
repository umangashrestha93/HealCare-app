const axios = require('axios');
async function run() {
  try {
    const res = await axios.get('http://127.0.0.1:5000/api/practitioners');
    const pract = res.data.data[0];
    const receiverId = pract.userId._id;
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5ZmVjNjI1ZmY2NWExNDFkMjY3YWE3MCIsInJvbGUiOiJjbGllbnQiLCJpYXQiOjE3NzgzMDU5MjAsImV4cCI6MTc4MDg5NzkyMH0.KNDurm6a1Ke8Zc1kWt0QRnzOyX_-bKTjwM7NbaSOZBU';
    
    const sendRes = await axios.post('http://127.0.0.1:5000/api/chat', 
      { receiverId, content: "Test message via script" }, 
      { headers: { Authorization: 'Bearer ' + token } }
    );
    console.log("Send success:", sendRes.data);
  } catch (err) {
    console.error("Error:", err.response?.data || err.message);
  }
}
run();
