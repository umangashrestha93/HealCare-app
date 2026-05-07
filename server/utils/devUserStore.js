const fs = require('fs/promises');
const path = require('path');

const storePath = path.resolve(__dirname, '../data/dev-users.json');

const ensureStore = async () => {
  await fs.mkdir(path.dirname(storePath), { recursive: true });
  try {
    await fs.access(storePath);
  } catch {
    await fs.writeFile(storePath, '[]');
  }
};

const readUsers = async () => {
  await ensureStore();
  const raw = await fs.readFile(storePath, 'utf8');
  return JSON.parse(raw || '[]');
};

const writeUsers = async (users) => {
  await ensureStore();
  await fs.writeFile(storePath, JSON.stringify(users, null, 2));
};

const findByEmail = async (email) => {
  const users = await readUsers();
  return users.find((user) => user.email === email) || null;
};

const findById = async (id) => {
  const users = await readUsers();
  return users.find((user) => user._id === id || user.id === id) || null;
};

const findByResetToken = async (hashedToken) => {
  const users = await readUsers();
  return users.find((user) => (
    user.resetPasswordToken === hashedToken
    && user.resetPasswordExpire > Date.now()
  )) || null;
};

const upsertUser = async (user) => {
  const users = await readUsers();
  const index = users.findIndex((item) => item.email === user.email || item._id === user._id);

  if (index >= 0) {
    users[index] = { ...users[index], ...user };
  } else {
    users.push(user);
  }

  await writeUsers(users);
  return user;
};

module.exports = {
  findByEmail,
  findById,
  findByResetToken,
  upsertUser
};
