export default async function handler(
  req,
  res
) {

  const redirectUri =
    process.env.TIKTOK_REDIRECT_URI

  const appKey =
    process.env.TIKTOK_APP_KEY

  const authUrl =
    `https://services.tiktokshop.com/open/authorize?` +
    `app_key=${appKey}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}`

  res.redirect(authUrl)
}