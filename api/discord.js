export default async function handler(
    request,
    response
) {
    if (request.method !== "POST") {
        return response.status(405).json({
            success: false,
            message: "Gunakan method POST."
        });
    }

    const receivedSecret =
        request.headers[
            "x-discord-notify-secret"
        ];

    const expectedSecret =
        process.env
            .DISCORD_NOTIFY_SECRET;

    if (
        !expectedSecret ||
        receivedSecret !== expectedSecret
    ) {
        return response.status(401).json({
            success: false,
            message: "Akses tidak diizinkan."
        });
    }

    const botToken =
        process.env.DISCORD_BOT_TOKEN;

    if (!botToken) {
        return response.status(500).json({
            success: false,
            message:
                "DISCORD_BOT_TOKEN belum diatur."
        });
    }

    try {
        let body =
            request.body || {};

        if (typeof body === "string") {
            body = JSON.parse(body);
        }

        const target =
            String(
                body.target || ""
            ).trim().toUpperCase();

        const channelMap = {
            MSMC:
                process.env
                    .DISCORD_CHANNEL_MSMC,

            MGR:
                process.env
                    .DISCORD_CHANNEL_MANAGER
        };

        const channelId =
            channelMap[target];

        if (!channelId) {
            return response.status(400).json({
                success: false,
                message:
                    "Target Discord tidak tersedia."
            });
        }

        const messageData =
            body.messageData;

        if (
            !messageData ||
            typeof messageData !== "object"
        ) {
            return response.status(400).json({
                success: false,
                message:
                    "Isi pesan Discord belum tersedia."
            });
        }

        const discordResponse =
            await fetch(
                "https://discord.com/api/v10/channels/" +
                    channelId +
                    "/messages",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        Authorization:
                            "Bot " + botToken
                    },

                    body:
                        JSON.stringify(
                            messageData
                        )
                }
            );

        const responseText =
            await discordResponse.text();

        let discordResult = null;

        if (responseText) {
            try {
                discordResult =
                    JSON.parse(
                        responseText
                    );
            } catch (error) {
                discordResult = {
                    raw: responseText
                };
            }
        }

        if (!discordResponse.ok) {
            return response
                .status(discordResponse.status)
                .json({
                    success: false,

                    message:
                        discordResult &&
                        discordResult.message
                            ? discordResult.message
                            : "Discord gagal menerima pesan.",

                    discordCode:
                        discordResult &&
                        discordResult.code
                            ? discordResult.code
                            : null
                });
        }

        return response.status(200).json({
            success: true,

            result: {
                messageId:
                    discordResult.id,

                channelId:
                    discordResult.channel_id,

                target: target
            }
        });
    } catch (error) {
        return response.status(500).json({
            success: false,

            message:
                error &&
                error.message
                    ? error.message
                    : "Gagal mengirim reminder Discord."
        });
    }
}