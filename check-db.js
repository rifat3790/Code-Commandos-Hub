const mongoose = require('mongoose');
const UserSchema = new mongoose.Schema({}, { strict: false });
const User = mongoose.model('User', UserSchema);

async function run() {
  await mongoose.connect('mongodb://rifat:RiFa123r107754n@ac-ayenpxs-shard-00-00.0pt5b9q.mongodb.net:27017,ac-ayenpxs-shard-00-01.0pt5b9q.mongodb.net:27017,ac-ayenpxs-shard-00-02.0pt5b9q.mongodb.net:27017/code_commandos?ssl=true&replicaSet=atlas-l2uko1-shard-0&authSource=admin&retryWrites=true&w=majority');
  const users = await User.find({ usageHistory: { $exists: true } });
  console.log('Users with history:', users.length);
  for (let u of users) {
     if (u.usageHistory && u.usageHistory.length > 0) {
        console.log('User:', u.email, 'History:', JSON.stringify(u.usageHistory, null, 2));
     }
  }
  process.exit(0);
}
run().catch(console.error);
