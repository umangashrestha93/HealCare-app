const axios = require('axios');

const run = async () => {
  try {
    const res = await axios.post('http://127.0.0.1:5001/api/auth/register', {
      firstName: 'Test',
      lastName: 'AgeRegister',
      email: `test_age_${Date.now()}@example.com`,
      phone: '0400000000',
      location: 'Sydney',
      password: 'password123',
      sex: 'Female',
      age: 29,
      role: 'client'
    });
    console.log('Registration success:', res.data);
  } catch (err) {
    console.error('Registration failed:', err.response?.data || err.message);
  }
};

run();
