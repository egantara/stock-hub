import {

  execFile

} from 'child_process'

export async function exportTiktok({

  data,
  templatePath,
  outputPath

}) {

  return new Promise(

    (resolve, reject) => {

      execFile(

        'python',

        [

          './python/export_tiktok.py',

          templatePath,

          outputPath,

          JSON.stringify(data)
        ],

        (

          error,

          stdout,

          stderr

        ) => {

          if (error) {

            console.log(stderr)

            reject(error)

            return
          }

          resolve(
            JSON.parse(stdout)
          )
        }
      )
    }
  )
}