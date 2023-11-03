const { SlashCommandBuilder } = require("discord.js")
const ini = require("ini")
const fs = require("fs")
const config = ini.parse(fs.readFileSync("./config/config.ini","utf-8"))

module.exports = {
	data: new SlashCommandBuilder()
	.setName("react")
	.setDescription("react emoji")
    .addStringOption((id) => {
        return id
        .setName("msg_id")
        .setDescription("the message's id you want to react emoji")
        .setRequired(true)
    })
    .addStringOption((id) => {
        return id
        .setName("emoji_id")
        .setDescription("the emoji's id you want to react ")
        .setRequired(false)
    }),
	async execute(interaction){

        if (interaction.user.id != config["MAIN"]["OWNER_ID"]) {
            embed = new EmbedBuilder()
            .setTitle("ERROR code[403]")
            .setDescription("you haven't permission")
            .setColor(0xfff200)
            await interaction.reply({embeds:[embed]})
        return
        }

        let emoji = interaction.options.getString("emoji_id")
        if (emoji == undefined){emoji = "<:Fubuki_tek:1144939980515446835>"}

        await interaction.reply({content:"react",fetchReply: true})
        .then(msg => msg.delete()).catch(console.error)


        interaction.channel.messages.fetch(interaction.options.getString("msg_id"))
        .then(msg => {msg.react(emoji)})
        .catch(console.error)
	}
}