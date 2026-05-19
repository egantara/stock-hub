export default async function handler(
  req,
  res
) {

  const { code } =
    req.query

  console.log(
    'TIKTOK AUTH CODE:',
    code
  )

  return res.status(200).send(`
    <h1>TikTok Connected</h1>
    <p>Authorization Success</p>
    <p>Code: ${code}</p>
  `)
}