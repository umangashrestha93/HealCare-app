const axios = require('axios');

const SEED_DATA = {
  firstName: 'Beyond5',
  lastName: 'Admin',
  email: 'admin@beyond5.com.au',
  password: 'AdminPassword123!',
  role: 'admin',
  adminSecret: 'beyond5_secret_2026' // Matches the key I added to authController.js
};

const seedAdmin = async () => {
  try {
    console.log('🚀 Attempting to create first admin...');
    const response = await axios.post('http://localhost:5000/api/auth/register', SEED_DATA);
    console.log('✅ Admin created successfully!');
    console.log('📧 Email:', SEED_DATA.email);
    console.log('🔑 Password:', SEED_DATA.password);
    console.log('-----------------------------------');
    console.log('Token:', response.data.access_token);
  } catch (error) {
    console.error('❌ Failed to create admin:', error.response?.data?.message || error.message);
  }
};

seedAdmin();
