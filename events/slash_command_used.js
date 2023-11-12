const { Events } = require('discord.js')
const { APPLICATION_tester } = require("../module/fetch_APPLICATION_tester")


module.exports = {
	name: Events.InteractionCreate,
	once: false,
	async execute(interaction) {
        if (!interaction.isChatInputCommand()) return;

        const command = interaction.client.commands.get(interaction.commandName);

        if (!command) {
            console.error(`No command matching ${interaction.commandName} was found.`);
            return;
        }

        try {
            if (command.beta == true){
                if (APPLICATION_tester.includes(interaction.user.id)){
                    await command.execute(interaction);
                }
                else{
                    if (interaction.replied || interaction.deferred) {
                        await interaction.followUp({ content: 'This command is on close beta', ephemeral: true });
                    } 
                    else {
                        await interaction.reply({ content: 'This command is on close beta', ephemeral: true });
                    }
                }
            }
            else{
                await command.execute(interaction);
            }
        } 
        catch (error) {
            console.error(error);
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
            } 
            else {
                await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
            }
        }
	},
};