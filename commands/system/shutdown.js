const { SlashCommandBuilder, EmbedBuilder } = require("discord.js")
const { OWNER_ID } = require("../../config/config.json")

module.exports = {
    data: new SlashCommandBuilder()
    .setName("shutdown")
    .setDescription("shutdown this bot"),
    async execute(interaction){
        if (interaction.user.id == OWNER_ID) {
        await interaction.reply("> shutdown")
        interaction.client.user.setStatus("invisible")
        await interaction.client.destroy()
        process.exit(0)
        }
        else{
            embed = new EmbedBuilder()
            .setTitle("ERROR code[403]")
            .setDescription("you haven't permission")
            .setColor(0xfff200)
            await interaction.reply({embeds:[embed]})
        }
    }
}