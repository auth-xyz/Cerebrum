export default {
  data: {
    name: 'messageCreate',
  },
  execute(message) {
    if (message.author.bot) return;
    console.log(message)
    console.log(`${message.author.username}: ${message.content}`);
  },
};

