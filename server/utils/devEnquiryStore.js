const crypto = require('crypto');
const fs = require('fs/promises');
const path = require('path');

const storePath = path.resolve(__dirname, '../data/dev-enquiries.json');

const ensureStore = async () => {
  await fs.mkdir(path.dirname(storePath), { recursive: true });
  try {
    await fs.access(storePath);
  } catch {
    await fs.writeFile(storePath, '[]');
  }
};

const readEnquiries = async () => {
  await ensureStore();
  const raw = await fs.readFile(storePath, 'utf8');
  return JSON.parse(raw || '[]');
};

const writeEnquiries = async (enquiries) => {
  await ensureStore();
  await fs.writeFile(storePath, JSON.stringify(enquiries, null, 2));
};

const create = async (payload) => {
  const enquiries = await readEnquiries();
  const enquiry = {
    _id: crypto.randomUUID(),
    status: 'new',
    source: 'marketplace',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...payload
  };

  enquiries.unshift(enquiry);
  await writeEnquiries(enquiries);
  return enquiry;
};

const findForClient = async (clientId) => {
  const enquiries = await readEnquiries();
  return enquiries.filter((enquiry) => enquiry.clientId === clientId);
};

const findAll = async () => readEnquiries();

module.exports = {
  create,
  findForClient,
  findAll
};
