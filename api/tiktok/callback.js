import axios from 'axios'

export default async function handler(req, res) {

  const code =
    req.query.code

  if (!code) {
    return res.send('No code')
  }

  try {

    const response =
      await axios.get(
        'https://open-api.tiktokglobalshop.com/authorization/202309/shops',
        {
          params: {
            app_key:
              process.env.TIKTOK_APP_KEY,

            app_secret:
              process.env.TIKTOK_APP_SECRET,

            auth_code: code
          }
        }
      )

    return res.json(response.data)

  } catch (err) {

    return res.json({
      error: err.message
    })
  }
}