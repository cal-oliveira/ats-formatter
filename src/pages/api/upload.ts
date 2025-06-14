import { NextApiRequest, NextApiResponse } from "next";
import formidable from "formidable";
import fs from "fs";
import pdf from "pdf-parse";
import mammoth from "mammoth";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const form = new formidable.IncomingForm({
    multiples: false,
    keepExtensions: true,
  });

  form.parse(req, async (err: any, fields: any, files: any) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Error parsing the files" });
    }

    const file = files.file;

    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const filepath = Array.isArray(file) ? file[0].filepath : file.filepath;
    const ext = filepath.split(".").pop()?.toLowerCase();

    try {
      let text = "";

      if (ext === "pdf") {
        const buffer = fs.readFileSync(filepath);
        const data = await pdf(buffer);
        text = data.text;
      } else if (ext === "docx") {
        const buffer = fs.readFileSync(filepath);
        const result = await mammoth.extractRawText({ buffer });
        text = result.value;
      } else {
        return res.status(400).json({ error: "Unsupported file type" });
      }

      console.log("Conteúdo do arquivo:\n", text);

      return res
        .status(200)
        .json({ message: "Arquivo lido com sucesso!", content: text });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Failed to process file" });
    }
  });
}
