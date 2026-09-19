export default async function handler(
    request,
    response
) {
    if (request.method !== "POST") {
        return response.status(405).json({
            success: false,
            message:
                "Gunakan method POST."
        });
    }

    const appsScriptUrl =
        process.env.GAS_WEB_APP_URL;

    if (!appsScriptUrl) {
        return response.status(500).json({
            success: false,
            message:
                "GAS_WEB_APP_URL belum diatur di Vercel."
        });
    }

    try {
        let requestBody =
            request.body || {};

        if (
            typeof requestBody === "string"
        ) {
            requestBody =
                JSON.parse(requestBody);
        }

        const appsScriptResponse =
            await fetch(
                appsScriptUrl,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "text/plain;charset=utf-8"
                    },

                    body:
                        JSON.stringify(
                            requestBody
                        ),

                    redirect: "follow"
                }
            );

        const responseText =
            await appsScriptResponse.text();

        let result;

        try {
            result =
                JSON.parse(responseText);
        } catch (error) {
            throw new Error(
                "Respons Apps Script bukan JSON."
            );
        }

        if (!result.success) {
            return response
                .status(400)
                .json({
                    success: false,

                    message:
                        result.message ||
                        "Apps Script gagal memproses data."
                });
        }

        return response
            .status(200)
            .json(result.result);
    } catch (error) {
        return response
            .status(500)
            .json({
                success: false,

                message:
                    error && error.message
                        ? error.message
                        : "Gagal menghubungi Apps Script."
            });
    }
}