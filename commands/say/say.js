const { SlashCommandBuilder } = require("discord.js")

module.exports = {
	data: new SlashCommandBuilder()
	.setName("say")
	.setDescription("say somthing")
	.addStringOption((say_something) =>
		say_something
		.setName("some_thing")
		.setDescription("Something you want to say.")
		.setRequired(true)
	),
	async execute(interaction){
		txt = interaction.options.getString("some_thing")
		await interaction.reply(txt)
	}
}

