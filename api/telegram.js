export default async function handler(
  req,
  res
) {

  console.log(
    JSON.stringify(
      req.body,
      null,
      2
    )
  );

  return res.status(200).json({
    ok: true
  });

  const chatId =
  req.body?.message?.chat?.id;

await sendMessage(
  chatId,
  "Bot hidup 🚀"
);

}