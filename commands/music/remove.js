const { SlashCommandBuilder } = require("discord.js")
const { queue } = require("./bin/functions.js")

module.exports = {
    data: new SlashCommandBuilder()
    .setName("remove")
    .setDescription("remove the song in queue")
    .addStringOption((index) => {
        return index
        .setName(index)
        .setDescription("the song's index you want to remove")
        .setRequired(true)
    }),
    async execute(interaction){
        const guild_id = ctx.guild.id
        const index = Number(interaction.options.getString("index"))
        if (index == NaN){
            await interaction.reply("index must be a number")
            return
        }
        const remove_song = queue[guild_id].splice(index - 1, 1)
        await interaction.reply({content:`removed [${remove_song.videoDetails.title}](${remove_song.videoDetails.video_url})`})
    }
}