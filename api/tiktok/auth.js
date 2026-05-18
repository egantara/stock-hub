export default async function handler(req, res) {

  const appKey =
    process.env.TIKTOK_APP_KEY

  const redirectUri =
    'https://inventory-bot-fqkg.vercel.app/api/tiktok/callback'

  const authUrl =
    `https://services.tiktokshop.com/open/authorize?app_key=${appKey}&redirect_uri=${encodeURIComponent(redirectUri)}`

  return res.redirect(authUrl)
}